import type { Core } from '@strapi/strapi';

/**
 * Resolves the owning course of a request.
 *
 * Ownership is rarely in the URL. `PUT /lessons/:id` carries a lesson id, and the
 * course it belongs to is a hop away. A policy that only inspects `ctx.params.id`
 * is the classic ownership leak, so every path walks up to the course explicitly.
 */
export type CourseSource = 'course' | 'lesson' | 'quiz' | 'question' | 'body';

type Ctx = {
  params?: Record<string, string>;
  request?: { body?: { data?: Record<string, unknown> } & Record<string, unknown> };
};

const documentIdFrom = (value: unknown): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value && typeof value === 'object' && 'documentId' in value) {
    const inner = (value as { documentId?: unknown }).documentId;
    return typeof inner === 'string' ? inner : null;
  }
  return null;
};

export async function resolveCourseId(
  strapi: Core.Strapi,
  ctx: Ctx,
  from: CourseSource
): Promise<string | null> {
  const paramId = ctx.params?.id ?? null;
  const body = ctx.request?.body?.data ?? ctx.request?.body ?? {};

  switch (from) {
    case 'course':
      return paramId;

    // Creating a lesson/quiz: the target course arrives in the payload.
    case 'body':
      return documentIdFrom((body as Record<string, unknown>).course);

    case 'lesson': {
      if (!paramId) return null;
      const lesson = await strapi.documents('api::lesson.lesson').findOne({
        documentId: paramId,
        populate: { course: { fields: ['documentId'] } },
      });
      return documentIdFrom(lesson?.course);
    }

    case 'quiz': {
      if (!paramId) return null;
      const quiz = await strapi.documents('api::quiz.quiz').findOne({
        documentId: paramId,
        populate: { course: { fields: ['documentId'] } },
      });
      return documentIdFrom(quiz?.course);
    }

    // question -> quiz -> course
    case 'question': {
      if (!paramId) return null;
      const question = await strapi.documents('api::question.question').findOne({
        documentId: paramId,
        populate: { quiz: { populate: { course: { fields: ['documentId'] } } } },
      });
      const quiz = question?.quiz as { course?: unknown } | undefined;
      return documentIdFrom(quiz?.course);
    }

    default:
      return null;
  }
}

/** True when the given user is the instructor who owns the course. */
export async function isCourseOwner(
  strapi: Core.Strapi,
  courseDocumentId: string,
  userId: number
): Promise<boolean> {
  const course = await strapi.documents('api::course.course').findOne({
    documentId: courseDocumentId,
    populate: { instructor: { fields: ['id'] } },
  });
  const instructor = course?.instructor as { id?: number } | undefined;
  return instructor?.id === userId;
}
