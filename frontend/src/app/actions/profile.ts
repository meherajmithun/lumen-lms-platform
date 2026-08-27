'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { updateMyProfile } from '@/lib/api/users';
import { updateSessionUser } from '@/lib/session';
import { toUserMessage } from '@/lib/strapi';

const profileSchema = z.object({
  username: z.string().trim().min(2, 'Your name needs at least 2 characters.').max(60),
  bio: z.string().trim().max(280, 'Your bio must be 280 characters or fewer.'),
  avatarUrl: z.union([
    z.literal(''),
    z.string().trim().max(500).url('Enter a valid profile image URL.').refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      'Use an http or https profile image URL.'
    ),
  ]),
});

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    username: formData.get('username'),
    bio: formData.get('bio') ?? '',
    avatarUrl: formData.get('avatarUrl') ?? '',
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Check your profile details.' };

  try {
    const updated = await updateMyProfile(parsed.data);
    await updateSessionUser({ ...user, username: updated.username });
    revalidatePath('/account');
    revalidatePath('/', 'layout');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}
