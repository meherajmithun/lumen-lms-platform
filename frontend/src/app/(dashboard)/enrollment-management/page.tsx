import { ComboOfferForm } from '@/components/lms/combo-offer-form';
import { EnrollmentManagementForm } from '@/components/lms/enrollment-management-form';
import { PageHeader } from '@/components/lms/page-header';
import {
  DEFAULT_ENROLLMENT_GUIDE,
  getComboOffer,
  getEnrollmentGuide,
} from '@/lib/api/enrollments';
import { requireRole } from '@/lib/auth';

export const metadata = { title: 'Enrollment Management' };

export default async function EnrollmentManagementPage() {
  await requireRole('content_manager');
  const [guide, offer] = await Promise.all([
    getEnrollmentGuide().catch(() => DEFAULT_ENROLLMENT_GUIDE),
    getComboOffer(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Content Manager"
        title="Enrollment Management"
        description="Edit the enrollment guidance, payment details, walkthrough, and public discounts from one place."
      />
      <EnrollmentManagementForm guide={guide} />
      <div className="mt-10 border-t border-border/80 pt-10">
        <ComboOfferForm offer={offer!} />
      </div>
    </div>
  );
}
