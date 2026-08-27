import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/lms/page-header';
import { RoleSelect } from '@/components/lms/role-select';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listUsers } from '@/lib/api/users';
import { requireRole } from '@/lib/auth';
import { ROLES, type Role } from '@/types/lms';

export const metadata: Metadata = { title: 'People' };

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const me = await requireRole('admin');
  const { page = '1', q = '' } = await searchParams;

  const result = await listUsers(Number(page) || 1, q);
  const users = result.data ?? [];
  const pagination = result.meta?.pagination;

  const adminCount = users.filter((u) => u.role?.type === ROLES.ADMIN).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Overview
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="Admin"
          title="People"
          description="Change what someone can do by changing their role."
        />
      </div>

      <form className="mb-5 flex max-w-sm gap-2" action="/admin/users">
        <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search people" />
        <button type="submit" className={buttonVariants({ variant: 'outline' })}>
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Person
              </th>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Joined
              </th>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const role = (user.role?.type ?? ROLES.STUDENT) as Role;
              const isSelf = user.id === me.id;
              // Strapi refuses both of these anyway; disabling them here just
              // avoids offering an action that is going to be rejected.
              const isLastAdmin = role === ROLES.ADMIN && adminCount <= 1;

              return (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pine-wash text-[11px] font-semibold text-pine">
                        {user.username.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {user.username}
                          {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <RoleSelect
                      userId={user.id}
                      username={user.username}
                      currentRole={role}
                      disabled={isSelf || isLastAdmin}
                      disabledReason={
                        isSelf
                          ? 'You cannot change your own role'
                          : 'Promote another admin before changing this one'
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pageCount > 1 && (
        <nav className="mt-5 flex items-center justify-between text-sm" aria-label="Pagination">
          <p className="text-muted-foreground tabular">
            Page {pagination.page} of {pagination.pageCount} · {pagination.total} people
          </p>
          <span className="flex gap-2">
            {pagination.page > 1 && (
              <Link
                href={`/admin/users?page=${pagination.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Previous
              </Link>
            )}
            {pagination.page < pagination.pageCount && (
              <Link
                href={`/admin/users?page=${pagination.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
