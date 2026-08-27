import 'server-only';
import { resolveStrapiMediaUrl, strapiFetch } from '@/lib/strapi';
import type { CourseProgress, Lesson, Paginated } from '@/types/lms';

export async function getCourseLessons(courseDocumentId: string): Promise<Lesson[]> {
  const res = await strapiFetch<Paginated<Lesson>>(
    `/lessons?filters[course][documentId][$eq]=${courseDocumentId}&sort=order:asc&pagination[pageSize]=200`
  );
  return (res.data ?? []).map((lesson) => ({
    ...lesson,
    videoUrl: resolveStrapiMediaUrl(lesson.videoUrl),
  }));
}

export async function getLesson(documentId: string): Promise<Lesson | null> {
  const res = await strapiFetch<{ data: Lesson }>(
    `/lessons/${documentId}?populate[course][fields][0]=slug&populate[course][fields][1]=title`
  );
  return res.data
    ? { ...res.data, videoUrl: resolveStrapiMediaUrl(res.data.videoUrl) }
    : null;
}

export async function completeLesson(
  documentId: string
): Promise<{ courseId: string; alreadyComplete: boolean; progress: CourseProgress }> {
  const res = await strapiFetch<{
    data: { courseId: string; alreadyComplete: boolean; progress: CourseProgress };
  }>(`/lessons/${documentId}/complete`, { method: 'POST' });
  return res.data;
}

export async function uncompleteLesson(
  documentId: string
): Promise<{ courseId: string; progress: CourseProgress }> {
  const res = await strapiFetch<{ data: { courseId: string; progress: CourseProgress } }>(
    `/lessons/${documentId}/complete`,
    { method: 'DELETE' }
  );
  return res.data;
}

export async function createLesson(data: Record<string, unknown>): Promise<void> {
  await strapiFetch('/lessons', { method: 'POST', body: JSON.stringify({ data }) });
}

export async function updateLesson(documentId: string, data: Record<string, unknown>): Promise<void> {
  await strapiFetch(`/lessons/${documentId}`, { method: 'PUT', body: JSON.stringify({ data }) });
}

export async function deleteLesson(documentId: string): Promise<void> {
  await strapiFetch(`/lessons/${documentId}`, { method: 'DELETE' });
}
