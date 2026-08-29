import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { calculateProgress } from '../../../utils/progress';
import { bodyData } from '../../../utils/request';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  /**
   * The student is taken from the JWT, never from the payload, so a crafted
   * `student` field cannot enroll somebody else. Enrolling twice is a 409 rather
   * than a duplicate row.
   *
   * Written through the Document Service because the content-API sanitiser drops
   * relations to content types the caller cannot read — and a student has no
   * permission to read users.
   */
  async create(ctx: ApiContext) {
    const user = ctx.state.user!;
    const input = bodyData(ctx);

    const courseId = typeof input.course === 'string' ? input.course : null;
    if (!courseId) return ctx.badRequest('A course is required');

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      fields: ['documentId', 'isPublished'],
    });
    if (!course) return ctx.notFound('Course not found');
    if (!course.isPublished) return ctx.badRequest('This course is not open for enrollment');

    const [existing] = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { student: { id: user.id }, course: { documentId: courseId } },
      fields: ['documentId'],
      limit: 1,
    });
    if (existing) return ctx.conflict('You are already enrolled in this course');

    const created = await strapi.documents('api::enrollment.enrollment').create({
      data: {
        student: user.id,
        course: courseId,
        enrolledAt: new Date(),
        status: 'active',
      },
      populate: { course: { fields: ['documentId', 'title', 'slug'] } },
    });

    const sanitized = await strapi.contentAPI.sanitize.output(
      created,
      strapi.contentType('api::enrollment.enrollment'),
      { auth: ctx.state.auth }
    );
    return { data: sanitized };
  },

  /**
   * GET /enrollments/mine — powers "My Courses", including each course's
   * progress percentage so the list renders in one round trip.
   */
  async mine(ctx: ApiContext) {
    const user = ctx.state.user!;

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { student: { id: user.id } },
      populate: {
        course: {
          fields: ['documentId', 'title', 'slug', 'description', 'coverImageUrl', 'level'],
          populate: { instructor: { fields: ['id', 'username'] } },
        },
      },
      sort: 'enrolledAt:desc',
      limit: -1,
    });

    // Fetch progress in two queries regardless of enrollment count. The old
    // implementation ran two queries per course, making navigation slower with
    // every new enrollment.
    const courseIds = enrollments
      .map((e) => (e.course as { documentId?: string } | undefined)?.documentId)
      .filter((id): id is string => Boolean(id));
    const [lessons, completedRows] = courseIds.length > 0
      ? await Promise.all([
          strapi.documents('api::lesson.lesson').findMany({
            filters: { course: { documentId: { $in: courseIds } } },
            fields: ['documentId', 'title', 'order', 'contentType', 'durationMinutes'],
            populate: { course: { fields: ['documentId'] } },
            limit: -1,
          }),
          strapi.documents('api::lesson-progress.lesson-progress').findMany({
            filters: { student: { id: user.id }, course: { documentId: { $in: courseIds } } },
            populate: {
              course: { fields: ['documentId'] },
              lesson: { fields: ['documentId'] },
            },
            limit: -1,
          }),
        ])
      : [[], []];

    const lessonIdsByCourse = new Map<string, string[]>();
    const lessonsByCourse = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const courseId = (lesson.course as { documentId?: string } | undefined)?.documentId;
      if (!courseId) continue;
      lessonIdsByCourse.set(courseId, [...(lessonIdsByCourse.get(courseId) ?? []), lesson.documentId]);
      lessonsByCourse.set(courseId, [...(lessonsByCourse.get(courseId) ?? []), lesson]);
    }
    const completedIdsByCourse = new Map<string, string[]>();
    for (const row of completedRows) {
      const courseId = (row.course as { documentId?: string } | undefined)?.documentId;
      const lessonId = (row.lesson as { documentId?: string } | undefined)?.documentId;
      if (!courseId || !lessonId) continue;
      completedIdsByCourse.set(courseId, [...(completedIdsByCourse.get(courseId) ?? []), lessonId]);
    }

    const data = enrollments.map((e) => {
      const course = e.course as { documentId?: string } | undefined;
      const courseId = course?.documentId;
      const progress = courseId
        ? calculateProgress(lessonIdsByCourse.get(courseId) ?? [], completedIdsByCourse.get(courseId) ?? [])
        : { completed: 0, total: 0, percent: 0, completedLessonIds: [] };
      const completedIds = new Set(progress.completedLessonIds);
      const completedLessons = courseId
        ? (lessonsByCourse.get(courseId) ?? [])
            .filter((lesson) => completedIds.has(lesson.documentId))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(({ documentId, title, order, contentType, durationMinutes }) => ({
              documentId,
              title,
              order,
              contentType,
              durationMinutes,
            }))
        : [];
      return {
        documentId: e.documentId,
        enrolledAt: e.enrolledAt,
        status: e.status,
        course: e.course,
        progress,
        completedLessons,
      };
    });

    // Historical rows can outlive a course when a database was created before
    // delete cleanup existed. Never send an unusable enrollment to the client;
    // bootstrap removes the same rows permanently on the next restart.
    return { data: data.filter((enrollment) => enrollment.course != null) };
  },
}));
