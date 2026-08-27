import { factories } from '@strapi/strapi';
import { ROLES } from '../../../constants/roles';
import { hasPlatformContentAccess, roleOf } from '../../../utils/auth';
import type { ApiContext } from '../../../utils/context';
import { bodyData, scopeFilters, slugify, stripProtectedFields } from '../../../utils/request';
import { resolveRelationId, roleTypeOf } from '../../../utils/relation';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  /**
   * Listing rules:
   *   ?scope=mine        -> courses this instructor owns (the teach view)
   *   authoring roles    -> everything
   *   students / public  -> published courses only
   *
   * The owner-scoped branch does its own query rather than pushing an
   * `instructor` filter into ctx.query. Strapi validates query filters against
   * relations the caller may read, and no role except Admin can read users — so
   * `filters[instructor]` is rejected as an invalid key for exactly the people
   * who need it. Shaping the response by hand also keeps the sanitiser from
   * dropping the instructor name for the same reason.
   */
  async find(ctx: ApiContext) {
    const user = ctx.state.user;
    const role = roleOf(user);

    if (ctx.query.scope === 'mine' || ctx.query.scope === 'manage') {
      if (!user) return ctx.forbidden('Authentication required');
      if (role !== ROLES.INSTRUCTOR && !hasPlatformContentAccess(user)) {
        return ctx.forbidden('Not permitted');
      }

      const ownCoursesOnly = ctx.query.scope === 'mine';

      const courses = await strapi.documents('api::course.course').findMany({
        filters: ownCoursesOnly ? { instructor: { id: user.id } } : {},
        populate: {
          instructor: { fields: ['id', 'username', 'avatarUrl'] },
          lessons: { fields: ['documentId', 'durationMinutes'] },
          enrollments: { fields: ['documentId'] },
        },
        sort: 'createdAt:desc',
        limit: -1,
      });

      return {
        data: courses.map((course) => ({
          documentId: course.documentId,
          title: course.title,
          slug: course.slug,
          description: course.description,
          coverImageUrl: course.coverImageUrl,
          level: course.level,
          price: course.price,
          discountPercent: course.discountPercent,
          isPublished: course.isPublished,
          instructor: course.instructor,
          lessons: course.lessons,
          lessonCount: (course.lessons ?? []).length,
          totalDurationMinutes: (course.lessons ?? []).reduce(
            (total, lesson) => total + (lesson.durationMinutes ?? 0), 0
          ),
          enrollments: course.enrollments,
          createdAt: course.createdAt,
        })),
      };
    }

    if (!hasPlatformContentAccess(user)) {
      scopeFilters(ctx, { isPublished: true });
    }

    const response = await super.find(ctx) as {
      data?: Array<Record<string, unknown> & { documentId?: string }>;
      meta?: unknown;
    };
    const data = response.data ?? [];
    const documentIds = data.flatMap((course) => course.documentId ? [course.documentId] : []);
    const [lessonSummaries, coursesWithInstructors] = await Promise.all([
      Promise.all(
        data.map((course) => course.documentId
          ? strapi.documents('api::lesson.lesson').findMany({
              filters: { course: { documentId: course.documentId } },
              fields: ['durationMinutes'],
              limit: -1,
            })
          : [])
      ),
      documentIds.length > 0
        ? strapi.documents('api::course.course').findMany({
            filters: { documentId: { $in: documentIds } },
            fields: ['documentId'],
            populate: { instructor: { fields: ['id', 'username', 'avatarUrl'] } },
            limit: -1,
          })
        : [],
    ]);
    const instructorByCourse = new Map(
      coursesWithInstructors.map((course) => [course.documentId, course.instructor ?? null])
    );

    return {
      ...response,
      data: data.map((course, index) => ({
        ...course,
        instructor: course.documentId ? instructorByCourse.get(course.documentId) ?? null : null,
        lessonCount: lessonSummaries[index]?.length ?? 0,
        totalDurationMinutes: (lessonSummaries[index] ?? []).reduce(
          (total, lesson) => total + (lesson.durationMinutes ?? 0), 0
        ),
      })),
    };
  },

  async findOne(ctx: ApiContext) {
    if (!hasPlatformContentAccess(ctx.state.user)) {
      scopeFilters(ctx, { isPublished: true });
    }
    return super.findOne(ctx);
  },

  /**
   * Ownership comes from the JWT, and is attached through the Document Service
   * rather than the request body.
   *
   * This is not just tidiness: Strapi's content-API sanitiser strips relations
   * pointing at content types the caller cannot read, and a Content Manager has
   * no permission to read users. Putting `instructor` in the body therefore fails
   * validation for exactly the roles that need it. Rebuilding the payload field by
   * field also means nothing a client sends can reach the writer unchecked.
   */
  async create(ctx: ApiContext) {
    const user = ctx.state.user!;
    const role = roleOf(user);
    const input = bodyData(ctx);

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (title.length < 3) return ctx.badRequest('A title of at least 3 characters is required');

    const level = LEVELS.includes(input.level as Level) ? (input.level as Level) : 'beginner';
    const price = Number(input.price ?? 0);
    if (!Number.isFinite(price) || price < 0) {
      return ctx.badRequest('Price must be a positive number or zero');
    }
    const discountPercent = Number(input.discountPercent ?? 0);
    if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      return ctx.badRequest('Discount must be a whole number from 0 to 100');
    }
    const slug =
      typeof input.slug === 'string' && input.slug.trim().length > 0
        ? slugify(input.slug)
        : `${slugify(title)}-${Date.now().toString(36)}`;

    let instructorId = user.id;
    if (role !== ROLES.INSTRUCTOR) {
      instructorId = await resolveRelationId(
        strapi,
        input.instructor,
        'plugin::users-permissions.user'
      ) ?? 0;
      if (!instructorId || await roleTypeOf(strapi, instructorId) !== ROLES.INSTRUCTOR) {
        return ctx.badRequest('Choose a user with the Instructor role');
      }
    }

    const created = await strapi.documents('api::course.course').create({
      data: {
        title,
        slug,
        level,
        price,
        discountPercent,
        description: typeof input.description === 'string' ? input.description : undefined,
        coverImageUrl: typeof input.coverImageUrl === 'string' ? input.coverImageUrl : undefined,
        isPublished: input.isPublished === true,
        instructor: instructorId,
      },
      populate: { instructor: { fields: ['id', 'username', 'avatarUrl'] } },
    });

    const sanitized = await strapi.contentAPI.sanitize.output(
      created,
      strapi.contentType('api::course.course'),
      { auth: ctx.state.auth }
    );
    return { data: sanitized };
  },

  /** Instructors cannot transfer ownership; platform content roles may reassign it. */
  async update(ctx: ApiContext) {
    const input = bodyData(ctx);
    if (hasPlatformContentAccess(ctx.state.user) && 'instructor' in input) {
      const instructorId = await resolveRelationId(
        strapi,
        input.instructor,
        'plugin::users-permissions.user'
      );
      if (!instructorId || await roleTypeOf(strapi, instructorId) !== ROLES.INSTRUCTOR) {
        return ctx.badRequest('Choose a user with the Instructor role');
      }
      await strapi.documents('api::course.course').update({
        documentId: ctx.params.id,
        data: { instructor: instructorId },
      });
    }
    stripProtectedFields(ctx, ['instructor', 'lessons', 'quizzes', 'enrollments']);
    return super.update(ctx);
  },

  /** Delete dependent learning records after the course itself is removed. */
  async delete(ctx: ApiContext) {
    const courseId = ctx.params.id;
    const [enrollments, progresses, learningSessions] = await Promise.all([
      strapi.documents('api::enrollment.enrollment').findMany({
        filters: { course: { documentId: courseId } },
        fields: ['documentId'],
        limit: -1,
      }),
      strapi.documents('api::lesson-progress.lesson-progress').findMany({
        filters: { course: { documentId: courseId } },
        fields: ['documentId'],
        limit: -1,
      }),
      strapi.documents('api::learning-session.learning-session').findMany({
        filters: { course: { documentId: courseId } },
        fields: ['documentId'],
        limit: -1,
      }),
    ]);

    const response = await super.delete(ctx);
    await Promise.all([
      ...enrollments.map((row) => strapi.documents('api::enrollment.enrollment').delete({
        documentId: row.documentId,
      })),
      ...progresses.map((row) => strapi.documents('api::lesson-progress.lesson-progress').delete({
        documentId: row.documentId,
      })),
      ...learningSessions.map((row) => strapi.documents('api::learning-session.learning-session').delete({
        documentId: row.documentId,
      })),
    ]);
    return response;
  },

  /** GET /courses/:id/manage — owner-only; reaching it at all proves ownership. */
  async manage(ctx: ApiContext) {
    const course = await strapi.documents('api::course.course').findOne({
      documentId: ctx.params.id,
      populate: {
        instructor: { fields: ['id', 'username', 'avatarUrl'] },
        lessons: { sort: 'order:asc' },
        // This endpoint is already owner-guarded, so it can return the quiz
        // editor data in the same request. A second /quizzes/:id/manage fetch
        // used to fail closed in the frontend and made successfully created
        // quizzes look as if they did not exist.
        quizzes: { populate: { questions: true } },
      },
    });
    if (!course) return ctx.notFound('Course not found');

    return {
      data: {
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        level: course.level,
        price: course.price,
        discountPercent: course.discountPercent,
        isPublished: course.isPublished,
        instructor: course.instructor,
        lessons: course.lessons,
        quizzes: course.quizzes,
      },
    };
  },

  /** GET /courses/by-slug/:slug — published course plus a safe syllabus. */
  async bySlug(ctx: ApiContext) {
    const [course] = await strapi.documents('api::course.course').findMany({
      filters: { slug: ctx.params.slug, isPublished: true },
      populate: {
        instructor: { fields: ['id', 'username', 'avatarUrl'] },
        lessons: { fields: ['title', 'order', 'contentType', 'durationMinutes'], sort: 'order:asc' },
        quizzes: { fields: ['title'] },
      },
      limit: 1,
    });
    if (!course) return ctx.notFound('Course not found');

    const lessons = (course.lessons ?? []) as Array<{
      documentId: string; title: string; order: number;
      contentType: string; durationMinutes?: number | null;
    }>;

    return {
      data: {
        documentId: course.documentId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        level: course.level,
        price: course.price,
        discountPercent: course.discountPercent,
        isPublished: course.isPublished,
        instructor: course.instructor,
        quizCount: (course.quizzes ?? []).length,
        totalDurationMinutes: lessons.reduce(
          (total, lesson) => total + (lesson.durationMinutes ?? 0), 0
        ),
        // Deliberately no body and no videoUrl.
        syllabus: lessons.map((l) => ({
          documentId: l.documentId,
          title: l.title,
          order: l.order,
          contentType: l.contentType,
          durationMinutes: l.durationMinutes ?? null,
        })),
      },
    };
  },

  /** GET /courses/:id/progress */
  async progress(ctx: ApiContext) {
    const user = ctx.state.user!;
    const courseId = ctx.params.id;

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      fields: ['documentId'],
    });
    if (!course) return ctx.notFound('Course not found');

    // Instructors may inspect progress only for courses they own, including
    // requests that omit studentId. Students remain restricted to themselves
    // below; Admin and Content Manager have platform-wide oversight.
    if (roleOf(user) === ROLES.INSTRUCTOR) {
      const owned = await strapi.documents('api::course.course').findOne({
        documentId: courseId,
        populate: { instructor: { fields: ['id'] } },
      });
      const instructor = owned?.instructor as { id?: number } | undefined;
      if (instructor?.id !== user.id) return ctx.forbidden('Not your course');
    }

    // A student may ask only about themselves. Course owners and platform
    // content roles may ask about a named student.
    const requested = ctx.query.studentId ? Number(ctx.query.studentId) : user.id;
    if (requested !== user.id && !hasPlatformContentAccess(user)) {
      if (roleOf(user) !== ROLES.INSTRUCTOR) return ctx.forbidden('Not permitted');
    }

    return strapi.service('api::course.course').getProgressFor(courseId, requested);
  },

  /** GET /courses/:id/students-progress — ownership already enforced by policy. */
  async studentsProgress(ctx: ApiContext) {
    const courseId = ctx.params.id;

    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { course: { documentId: courseId } },
      populate: { student: { fields: ['id', 'username', 'email'] } },
      limit: -1,
    });

    const service = strapi.service('api::course.course');
    const rows = await Promise.all(
      enrollments.map(async (e) => {
        const student = e.student as { id: number; username?: string; email?: string } | undefined;
        if (!student) return null;
        const p = await service.getProgressFor(courseId, student.id);
        return {
          student: { id: student.id, username: student.username, email: student.email },
          enrolledAt: e.enrolledAt,
          status: e.status,
          completed: p.completed,
          total: p.total,
          percent: p.percent,
        };
      })
    );

    return { data: rows.filter(Boolean) };
  },
}));
