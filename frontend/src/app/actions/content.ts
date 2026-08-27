'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createCourse, deleteCourse, updateCourse } from '@/lib/api/courses';
import { createLesson, deleteLesson, updateLesson } from '@/lib/api/lessons';
import { createQuestion, createQuiz, deleteQuestion, updateQuestion } from '@/lib/api/quizzes';
import { courseSchema, lessonSchema, questionSchema, quizSchema } from '@/lib/validation/content';
import { toUserMessage } from '@/lib/strapi';

/**
 * Every action here follows the same five steps: guard by role, validate the
 * input, call Strapi, revalidate exactly what changed, return a safe message.
 *
 * The guard is first and is never skipped. A Server Action is a public HTTP
 * endpoint in its own right, so protecting the page that renders the form is not
 * enough. Ownership ("this instructor's own courses") is not checked here at all
 * — that is Strapi's owns-course policy, which runs on every one of these calls
 * regardless of what this file does.
 */
type ActionResult = { ok: true } | { ok: false; error: string };

const AUTHORS = ['admin', 'content_manager', 'instructor'] as const;

const str = (form: FormData, key: string) => (form.get(key) ?? '').toString();

function refreshCourse(courseId?: string) {
  // Next 16: updateTag is the Server Action form of tag invalidation — it
  // expires immediately so the next read sees our own write.
  updateTag('courses');
  revalidatePath('/teach');
  revalidatePath('/courses');
  if (courseId) revalidatePath(`/teach/courses/${courseId}`);
}

// ---------------------------------------------------------------- courses

export async function createCourseAction(form: FormData): Promise<ActionResult> {
  const user = await requireRole(...AUTHORS);

  const parsed = courseSchema.safeParse({
    title: str(form, 'title'),
    description: str(form, 'description'),
    coverImageUrl: str(form, 'coverImageUrl'),
    level: str(form, 'level') || 'beginner',
    price: str(form, 'price') || 0,
    isPublished: form.get('isPublished') === 'on',
    instructorId: str(form, 'instructorId') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }
  if (user.role !== 'instructor' && !parsed.data.instructorId) {
    return { ok: false, error: 'Choose an instructor' };
  }

  let documentId: string;
  try {
    const { instructorId, ...fields } = parsed.data;
    const course = await createCourse({
      ...fields,
      ...(user.role === 'instructor' ? {} : { instructor: instructorId }),
    });
    documentId = course.documentId;
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  refreshCourse(documentId);
  redirect(`/teach/courses/${documentId}`);
}

export async function updateCourseAction(documentId: string, form: FormData): Promise<ActionResult> {
  const user = await requireRole(...AUTHORS);

  const parsed = courseSchema.safeParse({
    title: str(form, 'title'),
    description: str(form, 'description'),
    coverImageUrl: str(form, 'coverImageUrl'),
    level: str(form, 'level') || 'beginner',
    price: str(form, 'price') || 0,
    isPublished: form.get('isPublished') === 'on',
    instructorId: str(form, 'instructorId') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }
  if (user.role !== 'instructor' && !parsed.data.instructorId) {
    return { ok: false, error: 'Choose an instructor' };
  }

  try {
    const { instructorId, ...fields } = parsed.data;
    await updateCourse(documentId, {
      ...fields,
      ...(user.role === 'instructor' ? {} : { instructor: instructorId }),
    });
    refreshCourse(documentId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function deleteCourseAction(documentId: string): Promise<ActionResult> {
  await requireRole(...AUTHORS);
  try {
    await deleteCourse(documentId);
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
  refreshCourse();
  redirect('/teach');
}

// ---------------------------------------------------------------- lessons

export async function saveLessonAction(
  courseId: string,
  lessonId: string | null,
  form: FormData
): Promise<ActionResult> {
  await requireRole(...AUTHORS);

  const parsed = lessonSchema.safeParse({
    title: str(form, 'title'),
    contentType: str(form, 'contentType') || 'text',
    body: str(form, 'body'),
    videoUrl: str(form, 'videoUrl'),
    order: str(form, 'order') || 0,
    durationMinutes: str(form, 'durationMinutes') || 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }

  // Only the field that matches the chosen type is stored, so switching a lesson
  // from video to reading does not leave a stale URL behind.
  const data = {
    title: parsed.data.title,
    contentType: parsed.data.contentType,
    body: parsed.data.contentType === 'text' ? parsed.data.body : null,
    videoUrl: parsed.data.contentType === 'video' ? parsed.data.videoUrl : null,
    order: parsed.data.order,
    durationMinutes: parsed.data.durationMinutes || null,
  };

  try {
    if (lessonId) await updateLesson(lessonId, data);
    else await createLesson({ ...data, course: courseId });
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function deleteLessonAction(courseId: string, lessonId: string): Promise<ActionResult> {
  await requireRole(...AUTHORS);
  try {
    await deleteLesson(lessonId);
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/** Reordering writes the new position of both lessons that swapped. */
export async function reorderLessonsAction(
  courseId: string,
  updates: Array<{ documentId: string; order: number }>
): Promise<ActionResult> {
  await requireRole(...AUTHORS);
  try {
    await Promise.all(updates.map((u) => updateLesson(u.documentId, { order: u.order })));
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

// ---------------------------------------------------------------- quiz

export async function createQuizAction(courseId: string, form: FormData): Promise<ActionResult> {
  await requireRole(...AUTHORS);

  const parsed = quizSchema.safeParse({
    title: str(form, 'title'),
    description: str(form, 'description'),
    passingScore: str(form, 'passingScore') || 60,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }

  try {
    const created = await createQuiz({ ...parsed.data, course: courseId });
    if (!created?.documentId) {
      return { ok: false, error: 'The server did not confirm that the quiz was created.' };
    }
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function saveQuestionAction(
  courseId: string,
  quizId: string,
  questionId: string | null,
  form: FormData
): Promise<ActionResult> {
  await requireRole(...AUTHORS);

  const options = form.getAll('option').map((o) => o.toString().trim()).filter(Boolean);
  const parsed = questionSchema.safeParse({
    prompt: str(form, 'prompt'),
    options,
    correctIndex: str(form, 'correctIndex') || 0,
    order: str(form, 'order') || 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }
  if (parsed.data.correctIndex >= parsed.data.options.length) {
    return { ok: false, error: 'Mark one of the options as correct' };
  }

  const shaped = parsed.data.options.map((text, index) => ({ id: `opt-${index + 1}`, text }));
  const data = {
    prompt: parsed.data.prompt,
    options: shaped,
    correctOptionId: shaped[parsed.data.correctIndex].id,
    order: parsed.data.order,
  };

  try {
    if (questionId) await updateQuestion(questionId, data);
    else await createQuestion({ ...data, quiz: quizId, course: courseId });
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function deleteQuestionAction(courseId: string, questionId: string): Promise<ActionResult> {
  await requireRole(...AUTHORS);
  try {
    await deleteQuestion(questionId);
    refreshCourse(courseId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
