import type { Core } from '@strapi/strapi';

type Relation = { id?: number; documentId?: string } | null;

/** Removes historical tracking rows whose required relations no longer exist. */
export async function repairLearningSessions(strapi: Core.Strapi): Promise<void> {
  const rows = await strapi.query('api::learning-session.learning-session').findMany({
    select: ['id'],
    populate: {
      student: { select: ['id'] },
      course: { select: ['id', 'documentId'] },
      lesson: { select: ['id', 'documentId'] },
    },
  }) as Array<{ id: number; student?: Relation; course?: Relation; lesson?: Relation }>;
  let removed = 0;
  for (const row of rows) {
    if (row.student?.id && row.course?.documentId && row.lesson?.documentId) continue;
    await strapi.query('api::learning-session.learning-session').delete({ where: { id: row.id } });
    removed += 1;
  }
  if (removed > 0) strapi.log.warn(`[repair] removed ${removed} invalid learning session(s)`);
}
