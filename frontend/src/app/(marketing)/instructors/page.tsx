import { UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicInstructorProfiles } from '@/lib/api/users';

export const metadata = {
  title: 'Instructors | Lumen',
  description: 'Meet the instructors teaching courses on Lumen.',
};

export default async function InstructorsPage() {
  const instructors = await getPublicInstructorProfiles().catch(() => []);

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">Our instructors</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Learn from people who teach by doing.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Meet the instructors behind Lumen&apos;s courses and explore their teaching backgrounds.
        </p>
      </div>

      {instructors.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <article key={instructor.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Avatar size="lg" className="size-14">
                {instructor.avatarUrl && <AvatarImage src={instructor.avatarUrl} alt={instructor.username} />}
                <AvatarFallback className="bg-pine-wash font-semibold text-pine">
                  {instructor.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 font-heading text-lg font-semibold">{instructor.username}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-pine">
                <UserRound className="size-3.5" aria-hidden /> Instructor
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
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
