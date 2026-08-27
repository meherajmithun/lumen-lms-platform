export default {
  routes: [
    {
      // Student-facing: questions and options, never the answer key.
      method: 'GET',
      path: '/quizzes/:id/take',
      handler: 'quiz.take',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['student'] } },
          { name: 'global::is-enrolled', config: { from: 'quiz' } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/quizzes/:id/submit',
      handler: 'quiz.submit',
      config: {
        policies: [
          'global::is-authenticated',
          // Matrix: "Take quizzes" is Student-only, Admin included.
          { name: 'global::has-role', config: { roles: ['student'] } },
          { name: 'global::is-enrolled', config: { from: 'quiz' } },
        ],
      },
    },
    {
      // Owner-facing: the only way to read correctOptionId back, for editing.
      // The field is `private` in the schema, so nothing else can return it.
      method: 'GET',
      path: '/quizzes/:id/manage',
      handler: 'quiz.manage',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['admin', 'content_manager', 'instructor'] } },
          { name: 'global::owns-course', config: { from: 'quiz' } },
        ],
      },
    },
  ],
};
