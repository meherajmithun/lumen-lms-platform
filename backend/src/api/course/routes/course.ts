import { factories } from '@strapi/strapi';

const AUTHORS = { roles: ['admin', 'content_manager', 'instructor'] };

/**
 * Route-level policies. Reading is open (the controller narrows unpublished
 * courses); writing requires an authoring role, and update/delete additionally
 * require ownership of that specific course.
 */
export default factories.createCoreRouter('api::course.course', {
  config: {
    find: {},
    findOne: {},
    create: {
      policies: ['global::is-authenticated', { name: 'global::has-role', config: AUTHORS }],
    },
    update: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'course' } },
      ],
    },
    delete: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: AUTHORS },
        { name: 'global::owns-course', config: { from: 'course' } },
      ],
    },
  },
});
