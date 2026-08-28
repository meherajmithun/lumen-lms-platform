'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { approveInstructor, rejectInstructor, updateUserRole } from '@/lib/api/users';
import { toUserMessage } from '@/lib/strapi';
import { ROLES, type Role } from '@/types/lms';
import { reviewEnrollmentApplication, saveComboOffer, saveEnrollmentGuide } from '@/lib/api/enrollments';
import type { ComboOffer, EnrollmentGuide } from '@/types/lms';

/**
 * Changing a user's role — the matrix's "Manage users & assign roles" row,
 * which is Admin-only.
 *
 * Two guards live on the server, not here: an admin cannot change their own role,
 * and the last remaining admin cannot be demoted. Both are enforced in Strapi so
 * they hold even if this action is called directly.
 */
export async function updateUserRoleAction(
  userId: number,
  role: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole('admin');

  if (!Object.values(ROLES).includes(role as Role)) {
    return { ok: false, error: 'Unknown role' };
  }

  try {
    await updateUserRole(userId, role as Role);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function approveInstructorAction(userId: number) {
  await requireRole('admin');
  try {
    await approveInstructor(userId);
    revalidatePath('/admin/instructor-requests');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}

export async function rejectInstructorAction(userId: number) {
  await requireRole('admin');
  try {
    await rejectInstructor(userId);
    revalidatePath('/admin/instructor-requests');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}

export async function reviewEnrollmentAction(id: string, decision: 'approved' | 'rejected') {
  await requireRole('content_manager');
  try { await reviewEnrollmentApplication(id, decision); revalidatePath('/enrollment-requests'); revalidatePath('/courses'); return { ok: true as const }; }
  catch (error) { return { ok: false as const, error: toUserMessage(error) }; }
}
export async function saveEnrollmentGuideAction(data: EnrollmentGuide) {
  await requireRole('content_manager');
  try {
    await saveEnrollmentGuide(data);
    updateTag('enrollment-guide');
    revalidatePath('/enrollment-management');
    revalidatePath('/enroll');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}

/** Kept for compatibility with the original focused video editor. */
export async function saveEnrollmentVideoAction(videoUrl: string) {
  await requireRole('content_manager');
  try {
    await saveEnrollmentGuide({ videoUrl });
    updateTag('enrollment-guide');
    revalidatePath('/enrollment-management');
    revalidatePath('/enroll');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}

export async function saveComboOfferAction(data: ComboOffer) {
  await requireRole('content_manager');
  try {
    await saveComboOffer(data);
    updateTag('combo-offer');
    revalidatePath('/enrollment-management');
    revalidatePath('/courses');
    revalidatePath('/enroll');
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}
