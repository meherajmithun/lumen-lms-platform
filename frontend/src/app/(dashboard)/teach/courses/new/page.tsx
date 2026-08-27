import type { Metadata } from 'next';
import { CourseForm } from '@/components/lms/course-form';
import { PageHeader } from '@/components/lms/page-header';
import { requireRole } from '@/lib/auth';
import { listInstructors } from '@/lib/api/users';

export const metadata: Metadata = { title: 'New course' };

export default async function NewCoursePage() {
  const user = await requireRole('admin', 'content_manager', 'instructor');
  const instructors = user.role === 'instructor' ? [] : await listInstructors();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Teaching"
        title="New course"
        description="Start with the basics — you can add lessons and a quiz next."
      />
      <CourseForm role={user.role} instructors={instructors} />
    </div>
  );
}
