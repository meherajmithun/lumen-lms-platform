import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { homeFor } from '@/lib/permissions';

/** A single /dashboard entry point that sends each role to its own home. */
export default async function DashboardPage() {
  const user = await requireUser();
  redirect(homeFor(user.role));
}
