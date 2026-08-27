import { factories } from '@strapi/strapi';
import { ROLES } from '../../../constants/roles';
import { hasPlatformContentAccess, roleOf } from '../../../utils/auth';
import type { ApiContext } from '../../../utils/context';
import { bodyData, stripProtectedFields } from '../../../utils/request';
import type { GradeResult, SubmittedAnswer } from '../services/quiz';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  /** List quizzes only inside a course the caller may access. */
  async find(ctx: ApiContext) {
    const user = ctx.state.user!;
    if (!hasPlatformContentAccess(user)) {
      const filters = (ctx.query.filters ?? {}) as {
        course?: { documentId?: string | { $eq?: string } };
      };
      const rawCourseId = filters.course?.documentId;
      const courseId =
        typeof rawCourseId === 'string' ? rawCourseId : rawCourseId?.$eq;
      if (!courseId) return ctx.badRequest('A course filter is required');

      if (roleOf(user) === ROLES.STUDENT) {
        const [enrollment] = await strapi.documents('api::enrollment.enrollment').findMany({
          filters: { student: { id: user.id }, course: { documentId: courseId } },
          fields: ['documentId'],
          limit: 1,
        });
        if (!enrollment) return ctx.forbidden('You are not enrolled in this course');
      } else if (roleOf(user) === ROLES.INSTRUCTOR) {
        const course = await strapi.documents('api::course.course').findOne({
          documentId: courseId,
          populate: { instructor: { fields: ['id'] } },
        });
        const instructor = course?.instructor as { id?: number } | undefined;
        if (instructor?.id !== user.id) return ctx.forbidden('Not your course');
      } else {
        return ctx.forbidden('Not permitted');
      }
    }

    return super.find(ctx);
  },

  /**
   * Create a quiz and attach it to its course explicitly.
   *
   * The ownership policy has already verified the raw course documentId. Doing
   * the write through the Document Service prevents Strapi's generic content
   * API sanitiser from silently dropping that relation for an Instructor.
   */
  async create(ctx: ApiContext) {
    const input = bodyData(ctx);
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const courseId = typeof input.course === 'string' ? input.course : '';
    const passingScore = Number(input.passingScore ?? 60);

    if (!title) return ctx.badRequest('A quiz title is required');
    if (!courseId) return ctx.badRequest('A course is required');
    if (!Number.isInteger(passingScore) || passingScore < 0 || passingScore > 100) {
      return ctx.badRequest('Pass mark must be a whole number between 0 and 100');
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      fields: ['documentId'],
    });
    if (!course) return ctx.notFound('Course not found');

    const [existing] = await strapi.documents('api::quiz.quiz').findMany({
      filters: { course: { documentId: courseId } },
      fields: ['documentId'],
      limit: 1,
    });
    if (existing) return ctx.conflict('This course already has a quiz');

    const created = await strapi.documents('api::quiz.quiz').create({
      data: {
        title,
        description: typeof input.description === 'string' ? input.description : undefined,
        passingScore,
        course: courseId,
      },
      populate: { course: { fields: ['documentId', 'title', 'slug'] } },
    });

    return {
      data: {
        documentId: created.documentId,
        title: created.title,
        description: created.description,
        passingScore: created.passingScore,
        course: created.course,
        questions: [],
      },
    };
  },

  /** A quiz cannot be moved to another course after its owner was checked. */
  async update(ctx: ApiContext) {
    stripProtectedFields(ctx, ['course', 'questions', 'attempts']);
    return super.update(ctx);
  },

  /**
   * GET /quizzes/:id/take
   *
   * `correctOptionId` is marked private in the schema, so Strapi's sanitiser
   * already strips it from any response. Reading through the Document Service
   * here would bypass that, so we rebuild the payload explicitly — the answer key
   * is never placed on an object that gets serialised to a student.
   */
  async take(ctx: ApiContext) {
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: ctx.params.id,
      populate: { questions: true },
    });
    if (!quiz) return ctx.notFound('Quiz not found');

    const questions = (quiz.questions ?? []) as Array<{
      documentId: string;
      prompt: string;
      options: unknown;
      order: number;
    }>;

    return {
      data: {
        documentId: quiz.documentId,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        questions: questions
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((q) => ({
            documentId: q.documentId,
            prompt: q.prompt,
            options: q.options,
            order: q.order,
          })),
      },
    };
  },

  /**
   * POST /quizzes/:id/submit
   *
   * Score, correctCount and passed are computed here and written from the result.
   * Anything the client sends for those fields is ignored outright.
   */
  async submit(ctx: ApiContext) {
    const user = ctx.state.user!;
    const body = (ctx.request.body ?? {}) as { answers?: unknown };

    if (!Array.isArray(body.answers)) {
      return ctx.badRequest('answers must be an array');
    }

    const submitted: SubmittedAnswer[] = body.answers
      .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
      .map((a) => ({
        questionId: String(a.questionId ?? ''),
        selectedOptionId: a.selectedOptionId == null ? null : String(a.selectedOptionId),
      }))
      .filter((a) => a.questionId.length > 0);

    const result: GradeResult | null = await strapi
      .service('api::quiz.quiz')
      .grade(ctx.params.id, submitted);
    if (!result) return ctx.notFound('Quiz not found');

    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').create({
      data: {
        student: user.id,
        quiz: ctx.params.id,
        // Store what the student chose and whether it was right, but not the key.
        answers: result.answers.map(({ questionId, selectedOptionId, correct }) => ({
          questionId,
          selectedOptionId,
          correct,
        })),
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        passed: result.passed,
        submittedAt: new Date(),
      },
    });

    // The key is revealed only after grading, so the student can review answers.
    return {
      data: {
        attemptId: attempt.documentId,
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        passed: result.passed,
        answers: result.answers,
      },
    };
  },

  /** GET /quizzes/:id/manage — course owners only; includes the answer key. */
  async manage(ctx: ApiContext) {
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: ctx.params.id,
      populate: { questions: true },
    });
    if (!quiz) return ctx.notFound('Quiz not found');

    const questions = (quiz.questions ?? []) as Array<{
      documentId: string;
      prompt: string;
      options: unknown;
      correctOptionId: string;
      order: number;
    }>;

    return {
      data: {
        documentId: quiz.documentId,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        questions: questions
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((q) => ({
            documentId: q.documentId,
            prompt: q.prompt,
            options: q.options,
            correctOptionId: q.correctOptionId,
            order: q.order,
          })),
      },
    };
  },
}));
