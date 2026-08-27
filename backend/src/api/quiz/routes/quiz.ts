import { factories } from '@strapi/strapi';

const AUTHORS = { roles: ['admin', 'content_manager', 'instructor'] };

export default factories.createCoreRouter('api::quiz.quiz', {
  config: {
    find: { policies: ['global::is-authenticated'] },
    findOne: {
      policies: [
        'global::is-authenticated',
        { name: 'global::is-enrolled', config: { from: 'quiz' } },
      ],
    },
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
        { name: 'global::owns-course', config: { from: 'quiz' } },
      ],
    },
    delete: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'quiz' } },
      ],
    },
  },
});
