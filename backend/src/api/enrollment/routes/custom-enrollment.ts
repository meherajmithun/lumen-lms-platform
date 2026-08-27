export default {
  routes: [
    {
      method: 'GET',
      path: '/enrollments/mine',
      handler: 'enrollment.mine',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } },
        ],
      },
    },
  ],
};
