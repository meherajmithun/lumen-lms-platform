import 'server-only';
import { resolveStrapiMediaUrl, strapiFetch } from '@/lib/strapi';
import type { InstructorOption, InstructorProfile, InstructorRequest, Paginated, PlatformStats, Role, StrapiUser, UserProfile } from '@/types/lms';

export async function getMyProfile(): Promise<UserProfile> {
  const profile = await strapiFetch<UserProfile>('/users/me');
  return { ...profile, bio: profile.bio ?? '', avatarUrl: profile.avatarUrl ?? '' };
}

export async function updateMyProfile(data: Pick<UserProfile, 'username' | 'bio' | 'avatarUrl'>) {
  const response = await strapiFetch<{ data: Pick<UserProfile, 'id' | 'username' | 'bio' | 'avatarUrl'> }>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

type UploadedFile = { url?: string };

export async function uploadProfileImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('files', file, file.name);
  const uploaded = await strapiFetch<UploadedFile[]>('/upload', {
    method: 'POST',
    body: form,
  });
  const url = resolveStrapiMediaUrl(uploaded[0]?.url);
  if (!url) throw new Error('The image upload did not return a URL.');
  return url;
}

export async function listInstructors(): Promise<InstructorOption[]> {
  const res = await strapiFetch<{ data: InstructorOption[] }>('/instructors');
  return res.data ?? [];
}

export async function getPublicInstructorProfiles(): Promise<InstructorProfile[]> {
  const res = await strapiFetch<{ data: InstructorProfile[] }>('/instructor-profiles', {
    auth: false,
    tags: ['instructors'],
    revalidate: 60,
  });
  return res.data ?? [];
}

export async function listUsers(
  page = 1,
  search = ''
): Promise<Paginated<StrapiUser>> {
  const params = new URLSearchParams({ page: String(page), pageSize: '25' });
  if (search) params.set('search', search);
  return strapiFetch<Paginated<StrapiUser>>(`/users?${params.toString()}`);
}

export async function updateUserRole(userId: number, role: Role): Promise<void> {
  await strapiFetch(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function getPlatformStats(includeDetails = false): Promise<PlatformStats> {
  const path = includeDetails ? '/platform-stats?details=true' : '/platform-stats';
  const res = await strapiFetch<{ data: PlatformStats }>(path);
  return res.data;
}
export async function getInstructorRequests():Promise<InstructorRequest[]>{const r=await strapiFetch<{data:InstructorRequest[]}>('/instructor-requests');return r.data??[]}
export async function approveInstructor(id:number){await strapiFetch(`/instructor-requests/${id}/approve`,{method:'PUT'})}
export async function rejectInstructor(id:number){await strapiFetch(`/instructor-requests/${id}/reject`,{method:'PUT'})}
