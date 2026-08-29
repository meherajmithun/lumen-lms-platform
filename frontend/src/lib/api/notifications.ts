import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { NotificationItem } from '@/types/lms';

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const response = await strapiFetch<{ data: NotificationItem[] }>('/notifications/mine');
  return response.data ?? [];
}

export async function markAllNotificationsRead(): Promise<void> {
  await strapiFetch('/notifications/read-all', { method: 'PUT' });
}
