export default {
  routes: [
    {
      /**
       * Public course page data.
       *
       * A course's `lessons` relation is stripped for anonymous callers, because
       * the Public role has no permission to read lessons — and it should not
       * have one, since a lesson carries the actual teaching material. This
       * returns the syllabus instead: titles, order and length, with no body and
       * no video URL. The outline is public; the content is not.
       */
      method: 'GET',
      path: '/courses/by-slug/:slug',
      handler: 'course.bySlug',
      config: { auth: false },
    },
    {
      /**
       * The course editor's data source.
       *
       * A plain findOne cannot tell the frontend whether the caller owns this
       * course: the `instructor` relation is stripped for instructors, because
       * they have no permission to read users. Rather than inferring ownership
       * from a field that is not there, the editor asks an endpoint that is
       * itself ownership-guarded — a non-owner gets 403 instead of an editor
       * whose every control would be refused.
       */
      method: 'GET',
      path: '/courses/:id/manage',
      handler: 'course.manage',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['admin', 'content_manager', 'instructor'] } },
          { name: 'global::owns-course', config: { from: 'course' } },
        ],
      },
    },
    {
      // A student's own progress, or a course owner's view of it.
      method: 'GET',
      path: '/courses/:id/progress',
      handler: 'course.progress',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::is-enrolled', config: { from: 'course' } },
        ],
      },
    },
    {
      // Roster of enrolled students with their percentages — matrix row
      // "View student progress" for Instructor (own courses), CM and Admin.
      method: 'GET',
      path: '/courses/:id/students-progress',
      handler: 'course.studentsProgress',
      config: {
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['admin', 'content_manager', 'instructor'] } },
          { name: 'global::owns-course', config: { from: 'course' } },
        ],
      },
    },
  ],
};
