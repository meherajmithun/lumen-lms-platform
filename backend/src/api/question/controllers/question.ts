import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData, stripProtectedFields } from '../../../utils/request';

type Option = { id: string; text: string };

export default factories.createCoreController('api::question.question', ({ strapi }) => ({
  /**
   * `course` is present in the request only for the owns-course policy. It is
   * not a Question attribute, so the generic controller rejects it as an
   * "Invalid key course". Rebuild the writable payload explicitly and also
   * prove that the selected quiz actually belongs to that course.
   */
  async create(ctx: ApiContext) {
    const input = bodyData(ctx);
    const courseId = typeof input.course === 'string' ? input.course : '';
    const quizId = typeof input.quiz === 'string' ? input.quiz : '';
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const correctOptionId =
      typeof input.correctOptionId === 'string' ? input.correctOptionId : '';
    const order = Number(input.order ?? 0);
    const options = Array.isArray(input.options)
      ? input.options.filter(
          (value): value is Option =>
            Boolean(value) &&
            typeof value === 'object' &&
            typeof (value as Option).id === 'string' &&
            typeof (value as Option).text === 'string' &&
            (value as Option).text.trim().length > 0
        )
      : [];

    if (!courseId || !quizId) return ctx.badRequest('A course and quiz are required');
    if (prompt.length < 3) return ctx.badRequest('Write a question');
    if (options.length < 2) return ctx.badRequest('Add at least two options');
    if (!options.some((option) => option.id === correctOptionId)) {
      return ctx.badRequest('Choose one of the options as the correct answer');
    }
    if (!Number.isInteger(order) || order < 0) {
      return ctx.badRequest('Question position must be a positive whole number');
    }

    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: { course: { fields: ['documentId'] } },
    });
    const quizCourse = quiz?.course as { documentId?: string } | undefined;
    if (!quiz || quizCourse?.documentId !== courseId) {
      return ctx.badRequest('That quiz does not belong to this course');
    }

    const created = await strapi.documents('api::question.question').create({
      data: {
        prompt,
        options: options.map((option) => ({ ...option, text: option.text.trim() })),
        correctOptionId,
        order,
        quiz: quizId,
      },
    });

    return {
      data: {
        documentId: created.documentId,
        prompt: created.prompt,
        options: created.options,
        correctOptionId: created.correctOptionId,
        order: created.order,
      },
    };
  },

  /** A question cannot be moved to another quiz after ownership was checked. */
  async update(ctx: ApiContext) {
    stripProtectedFields(ctx, ['quiz']);
    return super.update(ctx);
  },
}));
