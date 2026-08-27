import type { Core } from '@strapi/strapi';
import { applyPermissions } from './bootstrap/apply-permissions';
import { ensureRoles } from './bootstrap/ensure-roles';
import { seedDemoData } from './bootstrap/seed-demo';
import { repairProgress } from './bootstrap/repair-progress';
import { registerRoleFilteredRelations } from './extensions/content-manager/role-filtered-relations';
import { repairRoleRelations } from './bootstrap/repair-role-relations';
import { repairLearningSessions } from './bootstrap/repair-learning-sessions';
import { repairUsers } from './bootstrap/repair-users';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerRoleFilteredRelations(strapi);
  },

  /**
   * Runs on every boot, including every Railway deploy.
   *
   * Roles and permissions are database rows, not code — they do not travel with a
   * git push. Reconciling them here from a declarative map is what keeps production
   * identical to local, and what stops a fresh database booting with no permissions
   * at all.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureRoles(strapi);
    await applyPermissions(strapi);
    await repairUsers(strapi);
    await repairRoleRelations(strapi);
    await repairProgress(strapi);
    await repairLearningSessions(strapi);

    if (process.env.SEED_DEMO_DATA === 'true') {
      await seedDemoData(strapi);
    }
  },
};
