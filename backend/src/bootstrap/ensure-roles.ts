import type { Core } from '@strapi/strapi';
import { ROLE_DEFINITIONS } from '../constants/roles';

/**
 * Creates the four application roles if they are missing. Idempotent: safe to run
 * on every boot, including every Railway redeploy.
 */
export async function ensureRoles(strapi: Core.Strapi): Promise<void> {
  for (const def of ROLE_DEFINITIONS) {
    const existing = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: def.type } });

    if (existing) continue;

    await strapi.query('plugin::users-permissions.role').create({
      data: { name: def.name, description: def.description, type: def.type },
    });
    strapi.log.info(`[bootstrap] created role "${def.name}" (${def.type})`);
  }
}
