import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type {
  Course, CourseProgress, CourseWithSyllabus, Paginated, StudentProgressRow,
} from '@/types/lms';

const qs = (params: Record<string, string | number | boolean | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

/** Public catalogue. Anonymous, so it may be cached and tagged. */
export async function getPublishedCourses(): Promise<Course[]> {
  const res = await strapiFetch<Paginated<Course>>(
    `/courses?${qs({
      'populate[instructor][fields][0]': 'username',
      'populate[instructor][fields][1]': 'avatarUrl',
      'sort': 'createdAt:desc',
      'pagination[pageSize]': 100,
    })}`,
    { auth: false, tags: ['courses'], revalidate: 60 }
  );
  return res.data ?? [];
}

/**
 * The public course page. Uses the dedicated syllabus endpoint because a course's
 * `lessons` relation is stripped for anonymous callers — Strapi removes relations
 * to content types the caller cannot read, and the Public role deliberately has
 * no access to lesson content.
 */
export async function getCourseSyllabus(slug: string): Promise<CourseWithSyllabus | null> {
  try {
    const res = await strapiFetch<{ data: CourseWithSyllabus }>(
      `/courses/by-slug/${encodeURIComponent(slug)}`,
      { auth: false, tags: ['courses', `course:${slug}`], revalidate: 60 }
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Authenticated lookup — includes the full lessons relation for enrolled users. */
export async function getCourseBySlugAuthed(slug: string): Promise<Course | null> {
  const res = await strapiFetch<Paginated<Course>>(
    `/courses?${qs({
      'filters[slug][$eq]': slug,
      'populate[instructor][fields][0]': 'username',
      'populate[instructor][fields][1]': 'avatarUrl',
      'populate[lessons][sort][0]': 'order:asc',
      'populate[quizzes][fields][0]': 'title',
    })}`
  );
  return res.data?.[0] ?? null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const res = await strapiFetch<Paginated<Course>>(
    `/courses?${qs({
      'filters[slug][$eq]': slug,
      'populate[instructor][fields][0]': 'username',
      'populate[instructor][fields][1]': 'avatarUrl',
      'populate[lessons][sort][0]': 'order:asc',
      'populate[quizzes][fields][0]': 'title',
    })}`,
    { auth: false, tags: ['courses', `course:${slug}`], revalidate: 60 }
  );
  return res.data?.[0] ?? null;
}

/** Authenticated view — includes unpublished courses the caller may manage. */
export async function getManagedCourses(scopeMine: boolean): Promise<Course[]> {
  const res = await strapiFetch<Paginated<Course>>(
    `/courses?${qs({
      scope: scopeMine ? 'mine' : 'manage',
      'populate[instructor][fields][0]': 'username',
      'populate[instructor][fields][1]': 'avatarUrl',
      'populate[lessons][fields][0]': 'documentId',
      'populate[enrollments][fields][0]': 'documentId',
      'sort': 'createdAt:desc',
      'pagination[pageSize]': 100,
    })}`
  );
  return res.data ?? [];
}

/**
 * The editor's fetch. Ownership is decided by Strapi: a non-owner gets 403 here,
 * which the page turns into a redirect rather than rendering a dead editor.
 */
export async function getCourseForEditing(documentId: string): Promise<Course | null> {
  try {
    const res = await strapiFetch<{ data: Course }>(`/courses/${documentId}/manage`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function getCourseById(documentId: string): Promise<Course | null> {
  const res = await strapiFetch<{ data: Course }>(
    `/courses/${documentId}?${qs({
      'populate[instructor][fields][0]': 'username',
      'populate[instructor][fields][1]': 'avatarUrl',
      'populate[lessons][sort][0]': 'order:asc',
      'populate[quizzes][fields][0]': 'title',
    })}`
  );
  return res.data ?? null;
}

export async function getCourseProgress(documentId: string): Promise<CourseProgress> {
  return strapiFetch<CourseProgress>(`/courses/${documentId}/progress`);
}

export async function getStudentsProgress(documentId: string): Promise<StudentProgressRow[]> {
  const res = await strapiFetch<{ data: StudentProgressRow[] }>(
    `/courses/${documentId}/students-progress`
  );
  return res.data ?? [];
}

export async function createCourse(data: Record<string, unknown>): Promise<Course> {
  const res = await strapiFetch<{ data: Course }>('/courses', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return res.data;
}

export async function updateCourse(documentId: string, data: Record<string, unknown>): Promise<void> {
  await strapiFetch(`/courses/${documentId}`, { method: 'PUT', body: JSON.stringify({ data }) });
}

export async function deleteCourse(documentId: string): Promise<void> {
  await strapiFetch(`/courses/${documentId}`, { method: 'DELETE' });
}
