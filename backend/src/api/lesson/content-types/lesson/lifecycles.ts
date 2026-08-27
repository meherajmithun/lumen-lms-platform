import { errors } from '@strapi/utils';

const { ValidationError } = errors;

const isUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * A lesson is either reading or a video, and the matching field has to be filled.
 *
 * The app's own form enforces this with zod, but the admin panel and a direct API
 * call do not go through that form — so it is enforced here too, where every
 * write path passes.
 */
function assertContentMatchesType(event: { params: { data?: Record<string, unknown> } }) {
  const data = event.params.data;
  if (!data) return;

  const contentType = data.contentType;
  if (contentType === undefined) return; // partial update that doesn't touch it

  if (contentType === 'video' && !isUrl(data.videoUrl)) {
    throw new ValidationError('A video lesson needs a valid http(s) video URL.');
  }

  if (contentType === 'text') {
    const body = typeof data.body === 'string' ? data.body.trim() : '';
    if (body === '') throw new ValidationError('A reading lesson needs some body text.');
  }
}

export default {
  beforeCreate: assertContentMatchesType,
  beforeUpdate: assertContentMatchesType,
};
