import type { Core } from '@strapi/strapi';
import { ROLES } from '../constants/roles';

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

  // Registrations created before role assignment used the low-level query API
  // and remained attached to Strapi's built-in Authenticated role. That role is
  // deliberately permissionless in this app, so those users can authenticate
  // but cannot load /users/me. Treat them as students, the safe signup default.
  const authenticatedRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });
  const studentRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: ROLES.STUDENT } });

  if (authenticatedRole && studentRole) {
    const strandedUsers = await strapi
      .query('plugin::users-permissions.user')
      .findMany({ where: { role: authenticatedRole.id }, select: ['id', 'email'] });
    const userService = strapi.plugin('users-permissions').service('user');
    for (const user of strandedUsers as Array<{ id: number; email?: string }>) {
      await userService.edit(user.id, { role: studentRole.id });
      strapi.log.warn(`[repair] assigned Student role to ${user.email ?? `user ${user.id}`}`);
    }
  }
}
