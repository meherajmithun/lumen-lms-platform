import { getLesson } from '@/lib/api/lessons';
import { requireRole } from '@/lib/auth';
import { strapiUrl } from '@/lib/strapi';

function safeFilename(value: string | null | undefined, fallback: string): string {
  const cleaned = (value || fallback).replace(/[\r\n"\\/]/g, '_').slice(0, 180);
  return cleaned || fallback;
}

/**
 * Streams an uploaded lesson file through the authenticated app origin.
 * Strapi deliberately blocks cross-origin framing, and exposing its raw upload
 * URL would also bypass the lesson enrollment check after the URL was learned.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  await requireRole('student');
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson || !['pdf', 'image'].includes(lesson.contentType) || !lesson.resourceUrl) {
    return new Response('Lesson resource not found', { status: 404 });
  }

  const resource = new URL(lesson.resourceUrl);
  const backend = new URL(strapiUrl);
  if (resource.origin !== backend.origin || !resource.pathname.startsWith('/uploads/')) {
    return new Response('Invalid lesson resource', { status: 400 });
  }

  const upstream = await fetch(resource, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!upstream.ok || !upstream.body) {
    return new Response('Lesson resource is unavailable', { status: 502 });
  }

  const wantsDownload = new URL(request.url).searchParams.get('download') === '1';
  const fallbackName = lesson.contentType === 'pdf' ? 'lesson.pdf' : 'lesson-image';
  const filename = safeFilename(lesson.resourceName, fallbackName);
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `${wantsDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
    'Content-Type': upstream.headers.get('content-type') || (lesson.contentType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
    'X-Content-Type-Options': 'nosniff',
  });
  const length = upstream.headers.get('content-length');
  if (length) headers.set('Content-Length', length);

  return new Response(upstream.body, { status: 200, headers });
}
