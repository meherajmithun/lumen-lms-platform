import type { Core } from '@strapi/strapi';

type Relation = { id?: number; documentId?: string } | null;
type ProgressRow = {
  id: number;
  student?: Relation;
  lesson?: (Relation & { course?: Relation }) | null;
  course?: Relation;
};

/**
 * Removes historical progress rows that could never be produced by the app's
 * completion endpoint. The repair is portable across SQLite and PostgreSQL and
 * safe to run on every boot.
 */
export async function repairProgress(strapi: Core.Strapi): Promise<void> {
  const rows = await strapi.query('api::lesson-progress.lesson-progress').findMany({
    populate: {
      student: { select: ['id'] },
      course: { select: ['id', 'documentId'] },
      lesson: {
        select: ['id', 'documentId'],
        populate: { course: { select: ['id', 'documentId'] } },
      },
    },
    orderBy: { id: 'asc' },
  }) as ProgressRow[];

  const seen = new Set<string>();
  const affected = new Map<string, { courseId: string; studentId: number }>();
  let removed = 0;

  for (const row of rows) {
    const studentId = row.student?.id;
    const courseId = row.course?.id;
    const courseDocumentId = row.course?.documentId;
    const lessonId = row.lesson?.id;
    const lessonCourseId = row.lesson?.course?.id;
    const duplicateKey = studentId && lessonId ? `${studentId}:${lessonId}` : null;
    const invalid = !studentId || !courseId || !courseDocumentId || !lessonId ||
      lessonCourseId !== courseId || (duplicateKey !== null && seen.has(duplicateKey));

    if (!invalid && duplicateKey) {
      seen.add(duplicateKey);
      continue;
    }

    if (studentId && courseDocumentId) {
      affected.set(`${studentId}:${courseDocumentId}`, {
        studentId,
        courseId: courseDocumentId,
      });
    }
    await strapi.query('api::lesson-progress.lesson-progress').delete({ where: { id: row.id } });
    removed += 1;
  }

  for (const { courseId, studentId } of affected.values()) {
    await strapi.service('api::course.course').syncEnrollmentStatus(courseId, studentId);
  }

  if (removed > 0) {
    strapi.log.warn(`[repair] removed ${removed} invalid lesson progress row(s)`);
  }
}
