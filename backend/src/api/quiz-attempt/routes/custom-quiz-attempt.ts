export default {
  routes: [
    {
      method: 'GET',
      path: '/quiz-attempts/mine',
      handler: 'quiz-attempt.mine',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } },
        ],
      },
    },
  ],
};
