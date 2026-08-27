import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseForm } from '@/components/lms/course-form';
import { LessonManager } from '@/components/lms/lesson-manager';
import { QuizManager } from '@/components/lms/quiz-manager';
import { StudentRoster } from '@/components/lms/student-roster';
import { DeleteCourseButton } from '@/components/lms/delete-course-button';
import { LessonSpine } from '@/components/lms/lesson-spine';
import { getCourseForEditing, getStudentsProgress } from '@/lib/api/courses';
import { requireRole } from '@/lib/auth';
import type { Quiz } from '@/types/lms';
import { listInstructors } from '@/lib/api/users';

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireRole('admin', 'content_manager', 'instructor');
  const { courseId } = await params;

  // This endpoint is ownership-guarded in Strapi, so a null here means either
  // "no such course" or "not yours". Either way the editor must not open.
  const course = await getCourseForEditing(courseId);
  if (!course) redirect('/403');
  const instructors = user.role === 'instructor' ? [] : await listInstructors();

  /**
   * The roster is owner-only. The course editor endpoint is also owner-guarded
   * and now includes its quiz editor data, avoiding a second request that could
   * hide a successfully created quiz when it failed.
   */
  const roster = await getStudentsProgress(courseId).catch(() => []);
  const quiz = (course.quizzes?.[0] as Quiz | undefined) ?? null;

  const lessons = (course.lessons ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/teach"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        All courses
      </Link>

      <div className="mt-4 mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            {course.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular">
            <span
              className={
                course.isPublished
                  ? 'rounded-full bg-pine-wash px-2 py-0.5 font-medium text-pine'
                  : 'rounded-full bg-clay-wash px-2 py-0.5 font-medium text-clay'
              }
            >
              {course.isPublished ? 'Published' : 'Draft'}
            </span>
            <span>{lessons.length} lessons</span>
            <span>·</span>
            <span>{roster.length} enrolled</span>
            {course.isPublished && (
              <Link
                href={`/courses/${course.slug}`}
                className="inline-flex items-center gap-1 text-pine underline-offset-4 hover:underline"
              >
                View public page
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            )}
          </p>
        </div>
        <DeleteCourseButton courseId={course.documentId} title={course.title} />
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="details">Details &amp; status</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-6">
          <LessonManager courseId={course.documentId} lessons={lessons} />
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <QuizManager courseId={course.documentId} quiz={quiz} />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentRoster rows={roster} />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {lessons.length > 0 && (
            <div className="mb-6 max-w-xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Course shape
              </p>
              <LessonSpine total={lessons.length} completed={0} />
            </div>
          )}
          <CourseForm course={course} role={user.role} instructors={instructors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
