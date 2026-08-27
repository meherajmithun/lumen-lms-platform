export default {
  routes: [
    {
      method: 'POST',
      path: '/learning-sessions/heartbeat',
      handler: 'learning-session.heartbeat',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } }
        ]
      }
    },
    {
      method: 'GET',
      path: '/learning-sessions/mine',
      handler: 'learning-session.mine',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } }
        ]
      }
    }
  ]
};
