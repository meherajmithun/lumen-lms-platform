import type { Metadata } from 'next';
import { InstructorReviewButtons } from '@/components/lms/approve-instructor-button';
import { PageHeader } from '@/components/lms/page-header';
import { getInstructorRequests } from '@/lib/api/users';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'Instructor requests' };

export default async function InstructorRequestsPage() {
  await requireRole('admin');
  const requests = await getInstructorRequests();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Admin"
        title="Instructor requests"
        description="Review new instructor accounts. Approved instructors can sign in immediately."
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        {requests.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No pending instructor requests.</p>
        ) : requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate font-medium">{request.username}</p>
              <p className="truncate text-sm text-muted-foreground">{request.email}</p>
            </div>
            <InstructorReviewButtons userId={request.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
