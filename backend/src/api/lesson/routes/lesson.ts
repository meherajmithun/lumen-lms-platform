import { factories } from '@strapi/strapi';

const AUTHORS = { roles: ['admin', 'content_manager', 'instructor'] };

export default factories.createCoreRouter('api::lesson.lesson', {
  config: {
    // Reading is narrowed to enrolled courses inside the controller, because a
    // list request has no single course id for a policy to check.
    find: { policies: ['global::is-authenticated'] },
    findOne: {
      policies: ['global::is-authenticated', { name: 'global::is-enrolled', config: { from: 'lesson' } }],
    },
    create: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        // The target course arrives in the payload on create.
        { name: 'global::owns-course', config: { from: 'body' } },
      ],
    },
    update: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'lesson' } },
      ],
    },
    delete: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'lesson' } },
      ],
    },
  },
});
