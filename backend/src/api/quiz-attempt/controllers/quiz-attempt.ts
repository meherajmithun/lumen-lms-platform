import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';

export default factories.createCoreController('api::quiz-attempt.quiz-attempt', ({ strapi }) => ({
  /** GET /quiz-attempts/mine — a student's stored results, newest first. */
  async mine(ctx: ApiContext) {
    const user = ctx.state.user!;

    const attempts = await strapi.documents('api::quiz-attempt.quiz-attempt').findMany({
      filters: { student: { id: user.id } },
      populate: {
        quiz: {
          fields: ['documentId', 'title', 'passingScore'],
          populate: { course: { fields: ['documentId', 'title', 'slug'] } },
        },
      },
      sort: 'submittedAt:desc',
      limit: -1,
    });

    return { data: attempts };
  },
}));
