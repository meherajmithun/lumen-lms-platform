import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { InstructorOption, Paginated, PlatformStats, Role, StrapiUser, UserProfile } from '@/types/lms';

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

export async function listInstructors(): Promise<InstructorOption[]> {
  const res = await strapiFetch<{ data: InstructorOption[] }>('/instructors');
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

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await strapiFetch<{ data: PlatformStats }>('/platform-stats');
  return res.data;
}
