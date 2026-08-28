import { PageHeader } from '@/components/lms/page-header';
import { getApprovedStories } from '@/lib/api/stories';

export const metadata = { title: 'Stories | Lumen' };

export default async function Page() {
  const stories = await getApprovedStories().catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <PageHeader
        eyebrow="Student voices"
        title="Stories from Lumen learners"
        variant="marketing"
      />
      <div className="grid gap-5 md:grid-cols-2">
        {stories.map((story) => (
          <article
            key={story.documentId}
            className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-raised)]"
          >
            <div className="mb-5 h-1 w-10 rounded-full bg-pine" aria-hidden />
            <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">
              {story.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-pine">{story.studentName}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {story.body}
            </p>
          </article>
        ))}
        {!stories.length && (
          <p className="text-sm text-muted-foreground">No approved stories yet.</p>
        )}
      </div>
    </main>
  );
}
