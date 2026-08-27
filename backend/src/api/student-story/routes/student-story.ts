export default{routes:[
{method:'GET',path:'/stories',handler:'student-story.approved',config:{auth:false}},
{method:'POST',path:'/stories',handler:'student-story.submit',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['student']}}]}},
{method:'GET',path:'/story-requests',handler:'student-story.queue',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['content_manager']}}]}},
{method:'PUT',path:'/story-requests/:id/review',handler:'student-story.review',config:{policies:['global::is-authenticated',{name:'global::has-role',config:{roles:['content_manager']}}]}}
]};
