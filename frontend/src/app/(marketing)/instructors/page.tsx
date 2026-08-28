import { UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/lms/page-header';
import { getPublicInstructorProfiles } from '@/lib/api/users';

export const metadata = {
  title: 'Instructors | Lumen',
  description: 'Meet the instructors teaching courses on Lumen.',
};

export default async function InstructorsPage() {
  const instructors = await getPublicInstructorProfiles().catch(() => []);

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <PageHeader
        eyebrow="Our instructors"
        title="Learn from people who teach by doing."
        description="Meet the instructors behind Lumen's courses and explore their teaching backgrounds."
        variant="marketing"
      />

      {instructors.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <article key={instructor.id} className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-pine/35 hover:shadow-[var(--shadow-float)]">
              <Avatar size="lg" className="size-16">
                {instructor.avatarUrl && <AvatarImage src={instructor.avatarUrl} alt={instructor.username} />}
                <AvatarFallback className="bg-pine-wash font-semibold text-pine">
                  {instructor.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em]">{instructor.username}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-pine">
                <UserRound className="size-3.5" aria-hidden /> Instructor
              </p>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {instructor.bio || 'This instructor has not added a profile introduction yet.'}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No instructor profiles are available yet.
        </p>
      )}
    </section>
  );
}
