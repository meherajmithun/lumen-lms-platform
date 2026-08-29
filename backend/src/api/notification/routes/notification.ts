export default {
  routes: [
    {
      method: 'GET',
      path: '/notifications/mine',
      handler: 'notification.mine',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'PUT',
      path: '/notifications/read-all',
      handler: 'notification.readAll',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
