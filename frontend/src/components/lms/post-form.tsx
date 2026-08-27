'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  createPostAction, deletePostAction, setPublishedAction, updatePostAction,
} from '@/app/actions/blog';
import type { Post } from '@/types/lms';

export function PostForm({ post }: { post?: Post }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isPublished = Boolean(post?.publishedAt);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    start(async () => {
      const result = post
        ? await updatePostAction(post.documentId, form)
        : await createPostAction(form);
      if (result && !result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(post ? 'Changes saved' : 'Draft created');
      router.refresh();
    });
  }

  function togglePublished() {
    if (!post) return;
    start(async () => {
      const result = await setPublishedAction(post.documentId, !isPublished);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // The control and the confirmation use the same word.
      toast.success(isPublished ? 'Unpublished' : 'Published');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      {post && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3">
          <span
            className={
              isPublished
                ? 'rounded-full bg-pine-wash px-2 py-0.5 text-xs font-medium text-pine'
                : 'rounded-full bg-clay-wash px-2 py-0.5 text-xs font-medium text-clay'
            }
          >
            {isPublished ? 'Published' : 'Draft'}
          </span>
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {isPublished
              ? 'Anyone can read this on the public blog.'
              : 'Only you and admins can see this. It is not on the public blog.'}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={togglePublished} disabled={pending}>
            {isPublished ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={post?.title} required minLength={3} maxLength={160} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={post?.excerpt ?? ''}
          placeholder="One or two lines, shown on the blog index."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImageUrl">Cover image URL</Label>
        <Input
          id="coverImageUrl"
          name="coverImageUrl"
          type="url"
          defaultValue={post?.coverImageUrl ?? ''}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Post</Label>
        <Textarea
          id="body"
          name="body"
          rows={16}
          defaultValue={post?.body ?? ''}
          required
          placeholder="Write the post. Leave a blank line between paragraphs."
          className="font-[family-name:var(--font-reading)] text-[15px] leading-relaxed"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {post ? 'Save changes' : 'Create draft'}
        </Button>

        {post && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{post.title}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the post permanently. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep the post</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    start(async () => {
                      const result = await deletePostAction(post.documentId);
                      if (result && !result.ok) toast.error(result.error);
                    })
                  }
                >
                  Delete post
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
