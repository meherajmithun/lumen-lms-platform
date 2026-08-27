import { factories } from '@strapi/strapi';

/**
 * Only `create` is exposed. Listing, updating and deleting enrollments through
 * the generic API would be a data-leak surface with no feature behind it —
 * students read their own via /enrollments/mine.
 */
export default factories.createCoreRouter('api::enrollment.enrollment', {
  only: ['create'],
  config: {
    create: {
      policies: [
        'global::is-authenticated',
        // The matrix marks "Enroll in a course" as Student-only — Admin included.
        { name: 'global::has-role', config: { roles: ['student'] } },
      ],
    },
  },
});
