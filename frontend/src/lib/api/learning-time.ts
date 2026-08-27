import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { LearningHistory } from '@/types/lms';

export async function getMyLearningHistory(days = 14): Promise<LearningHistory> {
  return strapiFetch<LearningHistory>(`/learning-sessions/mine?days=${days}`);
}
