'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import {
  createPost, deletePost, publishPost, unpublishPost, updatePost,
} from '@/lib/api/posts';
import { postSchema } from '@/lib/validation/content';
import { toUserMessage } from '@/lib/strapi';

type ActionResult = { ok: true } | { ok: false; error: string };

/** Matrix row "Write / manage blog posts": Admin and Content Manager only. */
const BLOG_AUTHORS = ['admin', 'content_manager'] as const;

const str = (form: FormData, key: string) => (form.get(key) ?? '').toString();

function refresh(postId?: string) {
  updateTag('posts');
  revalidatePath('/blog');
  revalidatePath('/blog-admin');
  if (postId) revalidatePath(`/blog-admin/${postId}`);
}

function parse(form: FormData) {
  return postSchema.safeParse({
    title: str(form, 'title'),
    excerpt: str(form, 'excerpt'),
    body: str(form, 'body'),
    coverImageUrl: str(form, 'coverImageUrl'),
  });
}

export async function createPostAction(form: FormData): Promise<ActionResult> {
  await requireRole(...BLOG_AUTHORS);

  const parsed = parse(form);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }

  let documentId: string;
  try {
    // New posts are always created as drafts. Publishing is a separate,
    // deliberate action rather than a side effect of saving.
    const post = await createPost(parsed.data);
    documentId = post.documentId;
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  refresh(documentId);
  redirect(`/blog-admin/${documentId}`);
}

export async function updatePostAction(documentId: string, form: FormData): Promise<ActionResult> {
  await requireRole(...BLOG_AUTHORS);

  const parsed = parse(form);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form' };
  }

  try {
    await updatePost(documentId, parsed.data);
    refresh(documentId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function setPublishedAction(
  documentId: string,
  published: boolean
): Promise<ActionResult> {
  await requireRole(...BLOG_AUTHORS);
  try {
    if (published) await publishPost(documentId);
    else await unpublishPost(documentId);
    refresh(documentId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function deletePostAction(documentId: string): Promise<ActionResult> {
  await requireRole(...BLOG_AUTHORS);
  try {
    await deletePost(documentId);
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
  refresh();
  redirect('/blog-admin');
}
