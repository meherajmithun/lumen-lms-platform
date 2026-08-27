const OWNER_POLICIES = [
  'global::is-authenticated',
  { name: 'global::has-role', config: { roles: ['admin', 'content_manager'] } },
  'global::owns-post',
];

export default {
  routes: [
    { method: 'POST', path: '/posts/:id/publish',   handler: 'post.publish',   config: { policies: OWNER_POLICIES } },
    { method: 'POST', path: '/posts/:id/unpublish', handler: 'post.unpublish', config: { policies: OWNER_POLICIES } },
  ],
};
