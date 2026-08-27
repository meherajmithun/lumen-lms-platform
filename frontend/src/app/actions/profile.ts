'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getMyProfile, updateMyProfile, uploadProfileImage } from '@/lib/api/users';
import { updateSessionUser } from '@/lib/session';
import { toUserMessage } from '@/lib/strapi';

const profileSchema = z.object({
  username: z.string().trim().min(2, 'Your name needs at least 2 characters.').max(60),
  bio: z.string().trim().max(280, 'Your bio must be 280 characters or fewer.'),
});

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    username: formData.get('username'),
    bio: formData.get('bio') ?? '',
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Check your profile details.' };

  const image = formData.get('avatar');
  if (image instanceof File && image.size > 0) {
    if (!IMAGE_TYPES.has(image.type)) {
      return { ok: false as const, error: 'Choose a JPG, PNG, WebP, or GIF image.' };
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return { ok: false as const, error: 'Profile images must be 5 MB or smaller.' };
    }
  }

  try {
    const avatarUrl = image instanceof File && image.size > 0
      ? await uploadProfileImage(image)
      : (await getMyProfile()).avatarUrl;
    const updated = await updateMyProfile({ ...parsed.data, avatarUrl });
    await updateSessionUser({ ...user, username: updated.username });
    revalidatePath('/account');
    revalidatePath('/', 'layout');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}
