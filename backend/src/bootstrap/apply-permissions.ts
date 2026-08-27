import type { Core } from '@strapi/strapi';
import { ALL_ROLES } from '../constants/roles';
import {
  AUTHENTICATED_PERMISSIONS,
  PERMISSIONS,
  PUBLIC_PERMISSIONS,
} from '../config/permissions-map';

/**
 * Reconciles each role's permissions with the declared map: grants what is missing,
 * revokes what is no longer declared. The map is the single source of truth, so a
 * permission removed from the code is removed from the database on the next boot.
 */

/** Flattens the plugin's action registry into "api::x.y.action" strings. */
function registeredActions(strapi: Core.Strapi): Set<string> {
  const actions = strapi
    .plugin('users-permissions')
    .service('users-permissions')
    .getActions() as Record<string, { controllers?: Record<string, Record<string, unknown>> }>;

  const out = new Set<string>();
  for (const [scope, def] of Object.entries(actions ?? {})) {
    for (const [controller, handlers] of Object.entries(def?.controllers ?? {})) {
      for (const handler of Object.keys(handlers ?? {})) {
        out.add(`${scope}.${controller}.${handler}`);
      }
    }
  }
  return out;
}

async function reconcile(
  strapi: Core.Strapi,
  roleType: string,
  desired: string[],
  valid: Set<string>
): Promise<void> {
  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });

  if (!role) {
    strapi.log.warn(`[bootstrap] role "${roleType}" not found — skipping permissions`);
    return;
  }

  // A declared action that does not exist yet is a typo or a not-yet-written custom
  // route. Warn loudly rather than failing the boot.
  const unknown = desired.filter((a) => !valid.has(a));
  if (unknown.length > 0) {
    strapi.log.warn(
      `[bootstrap] role "${roleType}" declares ${unknown.length} unknown action(s): ${unknown.join(', ')}`
    );
  }

  const target = new Set(desired.filter((a) => valid.has(a)));

  const current = (await strapi
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: role.id } })) as Array<{ id: number; action: string }>;

  const currentActions = new Set(current.map((p) => p.action));

  const toCreate = [...target].filter((a) => !currentActions.has(a));
  const toDelete = current.filter((p) => !target.has(p.action));

  for (const action of toCreate) {
    await strapi
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: role.id } });
  }
  for (const permission of toDelete) {
    await strapi.query('plugin::users-permissions.permission').delete({ where: { id: permission.id } });
  }

  if (toCreate.length || toDelete.length) {
    strapi.log.info(
      `[bootstrap] role "${roleType}": +${toCreate.length} / -${toDelete.length} permissions`
    );
  }
}

export async function applyPermissions(strapi: Core.Strapi): Promise<void> {
  const valid = registeredActions(strapi);

  for (const roleType of ALL_ROLES) {
    await reconcile(strapi, roleType, PERMISSIONS[roleType], valid);
  }

  await reconcile(strapi, 'public', PUBLIC_PERMISSIONS, valid);
  // Strapi's default role for any signed-up user. Stripped to nothing so it can
  // never become an accidental privilege path.
  await reconcile(strapi, 'authenticated', AUTHENTICATED_PERMISSIONS, valid);
}
