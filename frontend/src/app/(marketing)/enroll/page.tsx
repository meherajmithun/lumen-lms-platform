import { redirect } from 'next/navigation';
import { EnrollmentApplicationForm } from '@/components/lms/enrollment-application-form';
import { EnrollmentHelpCards } from '@/components/lms/enrollment-help-cards';
import { PageHeader } from '@/components/lms/page-header';
import { getPublishedCourses } from '@/lib/api/courses';
import {
  DEFAULT_ENROLLMENT_GUIDE,
  getComboOffer,
  getEnrollmentGuide,
  getMyEnrollmentsOptional,
} from '@/lib/api/enrollments';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Enroll | Lumen' };

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/403');

  const [courses, guide, comboOffer, enrollments] = await Promise.all([
    getPublishedCourses(),
    getEnrollmentGuide().catch(() => null),
    getComboOffer(),
    getMyEnrollmentsOptional(),
  ]);
  const { course } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <PageHeader
        eyebrow="Join Lumen"
        title="Enroll now"
        description="Pay for your selected courses, then submit the transaction for Content Manager approval."
        variant="marketing"
        align="center"
      />
      <EnrollmentHelpCards guide={guide ?? DEFAULT_ENROLLMENT_GUIDE} />
      <EnrollmentApplicationForm
        courses={courses.filter((item) => item.isPublished)}
        user={user}
        comboOffer={comboOffer!}
        isLoyal={Boolean(enrollments?.length)}
        initialSlug={course}
      />
    </main>
  );
}
