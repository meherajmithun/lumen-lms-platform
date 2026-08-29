import { notFound, redirect } from 'next/navigation';
import { LessonPlayer } from '@/components/lms/lesson-player';
import { getCourseBySlugAuthed } from '@/lib/api/courses';
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

  const [course, enrollments, lesson] = await Promise.all([
    getCourseBySlugAuthed(slug),
    getMyEnrollments(),
    getLesson(lessonId),
  ]);
  if (!course) notFound();
  if (!lesson) notFound();

  const enrollment = enrollments.find((e) => e.course?.documentId === course.documentId);
  if (!enrollment) {
    redirect(`/courses/${slug}`);
  }

  const progress = enrollment.progress;

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
