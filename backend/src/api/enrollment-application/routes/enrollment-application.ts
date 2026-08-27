export default { routes: [
  {method:'POST',path:'/enrollment-applications',handler:'enrollment-application.submit',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['student']}}]}},
  {method:'GET',path:'/enrollment-applications',handler:'enrollment-application.queue',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['content_manager']}}]}},
  {method:'PUT',path:'/enrollment-applications/:id/review',handler:'enrollment-application.review',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['content_manager']}}]}}
]};
