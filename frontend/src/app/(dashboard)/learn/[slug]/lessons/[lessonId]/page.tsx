import { notFound, redirect } from 'next/navigation';
import { LessonPlayer } from '@/components/lms/lesson-player';
import { getCourseBySlugAuthed, getCourseProgress } from '@/lib/api/courses';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { getLesson } from '@/lib/api/lessons';
import { requireRole } from '@/lib/auth';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  await requireRole('student');
  const { slug, lessonId } = await params;

  const course = await getCourseBySlugAuthed(slug);
  if (!course) notFound();

  const enrollments = await getMyEnrollments();
  if (!enrollments.some((e) => e.course?.documentId === course.documentId)) {
    redirect(`/courses/${slug}`);
  }

  const [lesson, progress] = await Promise.all([
    getLesson(lessonId),
    getCourseProgress(course.documentId),
  ]);
  if (!lesson) notFound();

  const lessons = (course.lessons ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <LessonPlayer
      slug={slug}
      courseTitle={course.title}
      lesson={lesson}
      lessons={lessons.map((l) => ({ documentId: l.documentId, title: l.title }))}
      completedIds={progress.completedLessonIds}
      progress={progress}
      quizId={course.quizzes?.[0]?.documentId}
    />
  );
}
