import { errors } from '@strapi/utils';
import { ROLES } from '../../../../constants/roles';
import { resolveUserId, roleTypeOf } from '../../../../utils/relation';

const { ValidationError } = errors;
let roleRepairActive = false;

/** Bootstrap-only escape hatch used while clearing historical invalid owners. */
export async function duringCourseRoleRepair<T>(task: () => Promise<T>): Promise<T> {
  roleRepairActive = true;
  try {
    return await task();
  } finally {
    roleRepairActive = false;
  }
}

/**
 * A course's instructor must actually be able to teach.
 *
 * The admin relation picker is filtered for usability, but validation here is
 * the security boundary for the admin panel, REST and future write paths.
 */
async function assertInstructorCanTeach(event: {
  params: { data?: Record<string, unknown> };
}, required = false) {
  const data = event.params.data;
  if (!data || !('instructor' in data)) {
    if (required) throw new ValidationError('A course needs an Instructor.');
    return;
  }

  const strapi = (global as unknown as { strapi: Parameters<typeof resolveUserId>[0] }).strapi;
  const userId = await resolveUserId(strapi, data.instructor);
  if (userId == null) {
    if (roleRepairActive) return;
    throw new ValidationError('A course needs an Instructor.');
  }

  const role = await roleTypeOf(strapi, userId);
  if (role !== ROLES.INSTRUCTOR) {
    throw new ValidationError(
      `A course's instructor must have the Instructor role. ` +
        `That user is ${role ? `a ${role.replace('_', ' ')}` : 'not assigned a role'}.`
    );
  }
}

export default {
  beforeCreate: (event: { params: { data?: Record<string, unknown> } }) =>
    assertInstructorCanTeach(event, true),
  beforeUpdate: assertInstructorCanTeach,
};
