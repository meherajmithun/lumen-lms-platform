import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData } from '../../../utils/request';
import { buildLearningHistory, heartbeatIncrement, utcDate } from '../../../utils/learning-time';

type SessionRow = {
  documentId: string;
  activityDate: string;
  activeSeconds: number;
  lastSequence: number;
  lastHeartbeatAt: string;
};

export default factories.createCoreController('api::learning-session.learning-session', ({ strapi }) => ({
  async heartbeat(ctx: ApiContext) {
    const user = ctx.state.user!;
    const input = bodyData(ctx);
    const sessionKey = typeof input.sessionKey === 'string' ? input.sessionKey.trim() : '';
    const lessonId = typeof input.lessonId === 'string' ? input.lessonId : '';
    const sequence = Number(input.sequence);
    if (!sessionKey || sessionKey.length > 80 || !lessonId || !Number.isInteger(sequence) || sequence < 0) {
      return ctx.badRequest('A valid sessionKey, lessonId and sequence are required');
    }

    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: lessonId,
      fields: ['documentId', 'contentType', 'body', 'videoUrl'],
      populate: { course: { fields: ['documentId'] } },
    });
    const course = lesson?.course as { documentId?: string } | null | undefined;
    if (!lesson || !course?.documentId) return ctx.notFound('Lesson not found');
    const hasContent = lesson.contentType === 'video'
      ? Boolean(lesson.videoUrl?.trim())
      : Boolean(lesson.body?.trim());
    if (!hasContent) return ctx.badRequest('This lesson has no trackable content');

    const [enrollment] = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { student: { id: user.id }, course: { documentId: course.documentId } },
      fields: ['documentId'],
      limit: 1,
    });
    if (!enrollment) return ctx.forbidden('You are not enrolled in this course');

    const now = new Date();
    const activityDate = utcDate(now);
    const [existing] = await strapi.documents('api::learning-session.learning-session').findMany({
      filters: { student: { id: user.id }, sessionKey, activityDate },
      fields: ['documentId', 'activityDate', 'activeSeconds', 'lastSequence', 'lastHeartbeatAt'],
      limit: 1,
    }) as SessionRow[];

    if (!existing) {
      const created = await strapi.documents('api::learning-session.learning-session').create({
        data: {
          student: user.id,
          course: course.documentId,
          lesson: lessonId,
          sessionKey,
          activityDate,
          // Reaching this endpoint means the visible client observed a genuine
          // reading interaction or playback event. Credit one second so a short
          // but real visit is visible instead of creating a zero-only session.
          activeSeconds: 1,
          lastSequence: sequence,
          lastHeartbeatAt: now,
        },
      });
      return { data: { documentId: created.documentId, activeSeconds: 1, countedSeconds: 1 } };
    }

    if (sequence <= existing.lastSequence) {
      return { data: { documentId: existing.documentId, activeSeconds: existing.activeSeconds, countedSeconds: 0 } };
    }
    const increment = heartbeatIncrement(new Date(existing.lastHeartbeatAt), now);
    const activeSeconds = existing.activeSeconds + increment;
    await strapi.documents('api::learning-session.learning-session').update({
      documentId: existing.documentId,
      data: { activeSeconds, lastSequence: sequence, lastHeartbeatAt: now },
    });
    return { data: { documentId: existing.documentId, activeSeconds, countedSeconds: increment } };
  },

  async mine(ctx: ApiContext) {
    const user = ctx.state.user!;
    const days = Math.min(90, Math.max(1, Number(ctx.query.days ?? 14)));
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days + 1);
    const rows = await strapi.documents('api::learning-session.learning-session').findMany({
      filters: { student: { id: user.id }, activityDate: { $gte: utcDate(start) } },
      fields: ['activityDate', 'activeSeconds'],
      limit: -1,
    }) as Array<{ activityDate: string; activeSeconds: number }>;
    return buildLearningHistory(rows.map((row) => ({
      date: row.activityDate,
      activeSeconds: row.activeSeconds,
    })), days);
  },
}));
