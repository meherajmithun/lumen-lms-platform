import { factories } from '@strapi/strapi';

const BLOG_AUTHORS = { roles: ['admin', 'content_manager'] };

export default factories.createCoreRouter('api::post.post', {
  config: {
    // Reading is public. The controller decides which entries are visible.
    find: {},
    findOne: {},
    create: {
      policies: ['global::is-authenticated', { name: 'global::has-role', config: BLOG_AUTHORS }],
    },
    update: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: BLOG_AUTHORS },
        'global::owns-post',
      ],
    },
    delete: {
      policies: [
        'global::is-authenticated',
        { name: 'global::has-role', config: BLOG_AUTHORS },
        'global::owns-post',
      ],
    },
  },
});
