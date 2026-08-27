import { factories } from '@strapi/strapi';

const AUTHORS = { roles: ['admin', 'content_manager', 'instructor'] };

/**
 * Questions are never read through this router — students get them via
 * /quizzes/:id/take (sanitised) and owners via /quizzes/:id/manage.
 * Only the write routes are exposed, each ownership-checked.
 */
export default factories.createCoreRouter('api::question.question', {
  only: ['create', 'update', 'delete'],
  config: {
    create: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'body' } },
      ],
    },
    update: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'question' } },
      ],
    },
    delete: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'question' } },
      ],
    },
  },
});
