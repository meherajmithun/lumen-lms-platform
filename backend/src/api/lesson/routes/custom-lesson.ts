export default {
  routes: [
    {
      method: 'POST',
      path: '/lessons/:id/complete',
      handler: 'lesson.complete',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } },
          { name: 'global::is-enrolled', config: { from: 'lesson' } },
        ],
      },
    },
    {
      method: 'DELETE',
      path: '/lessons/:id/complete',
      handler: 'lesson.uncomplete',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } },
          { name: 'global::is-enrolled', config: { from: 'lesson' } },
        ],
      },
    },
  ],
};
