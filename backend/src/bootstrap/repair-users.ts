import type { Core } from '@strapi/strapi';

/**
 * Removes historical Users & Permissions rows that contain no account data.
 *
 * An older demo seed created rows containing only an id. They cannot log in and
 * cannot be repaired because neither an email nor username exists to identify
 * the intended account. Run this independently of demo seeding so production
 * databases created during that period are repaired even after seeding is off.
 */
export async function repairUsers(strapi: Core.Strapi): Promise<void> {
  const users = await strapi
    .query('plugin::users-permissions.user')
    .findMany({ select: ['id', 'username', 'email'] });

  const emptyUsers = (users as Array<{
    id: number;
    username?: string | null;
    email?: string | null;
  }>).filter((user) => !user.username?.trim() && !user.email?.trim());

  for (const user of emptyUsers) {
    await strapi
      .query('plugin::users-permissions.user')
      .delete({ where: { id: user.id } });
  }

  if (emptyUsers.length > 0) {
    strapi.log.warn(`[repair] removed ${emptyUsers.length} unusable blank user record(s)`);
  }
}
