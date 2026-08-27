import type { Core } from '@strapi/strapi';

/**
 * Pulls an entity id out of a relation value, whichever shape it arrives in.
 *
 * The admin panel sends `{ connect: [{ id }], disconnect: [] }`, the Document
 * Service sends a documentId string or a numeric id, and REST can send either.
 * Lifecycle hooks see all three, so they all have to be handled.
 */
export async function resolveRelationId(
  strapi: Core.Strapi,
  value: unknown,
  uid: string
): Promise<number | null> {
  if (value == null) return null;

  // Strapi Admin may submit a relation as a plain array, especially when the
  // field was changed from its initial value in the entry editor.
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return resolveRelationId(strapi, value[value.length - 1], uid);
  }

  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    // Numeric string, or a documentId that needs looking up.
    if (/^\d+$/.test(value)) return Number(value);
    const entity = await strapi
      .query(uid as never)
      .findOne({ where: { documentId: value }, select: ['id'] });
    return entity?.id ?? null;
  }

  if (typeof value === 'object') {
    const v = value as {
      id?: unknown;
      documentId?: unknown;
      connect?: unknown[];
      set?: unknown[];
    };

    if (Array.isArray(v.connect) && v.connect.length > 0) {
      return resolveRelationId(strapi, v.connect[v.connect.length - 1], uid);
    }
    if (Array.isArray(v.set) && v.set.length > 0) {
      return resolveRelationId(strapi, v.set[v.set.length - 1], uid);
    }
    if (v.id != null) return resolveRelationId(strapi, v.id, uid);
    if (v.documentId != null) return resolveRelationId(strapi, v.documentId, uid);
  }

  return null;
}

export const resolveUserId = (strapi: Core.Strapi, value: unknown) =>
  resolveRelationId(strapi, value, 'plugin::users-permissions.user');

/** The role type of a user, or null. */
export async function roleTypeOf(strapi: Core.Strapi, userId: number): Promise<string | null> {
  const user = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: { id: userId }, populate: { role: true } });
  return (user?.role as { type?: string } | undefined)?.type ?? null;
}
