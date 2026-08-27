import'server-only';import{strapiFetch}from'@/lib/strapi';import type{StudentStory}from'@/types/lms';
export async function getApprovedStories(){const r=await strapiFetch<{data:StudentStory[]}>('/stories',{auth:false,tags:['stories'],revalidate:60});return r.data??[]}
export async function submitStory(data:{title:string;body:string}){await strapiFetch('/stories',{method:'POST',body:JSON.stringify({data})})}
export async function getStoryRequests(){const r=await strapiFetch<{data:StudentStory[]}>('/story-requests');return r.data??[]}
export async function reviewStory(id:string,decision:'approved'|'rejected'){await strapiFetch(`/story-requests/${id}/review`,{method:'PUT',body:JSON.stringify({data:{decision}})})}
