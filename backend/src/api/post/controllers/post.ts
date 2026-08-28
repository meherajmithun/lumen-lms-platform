import { factories } from '@strapi/strapi';
import { ROLES } from '../../../constants/roles';
import { roleOf } from '../../../utils/auth';
import type { ApiContext } from '../../../utils/context';
import { bodyData, slugify, stripProtectedFields } from '../../../utils/request';

/** Only Admin and Content Manager may ever see a draft. */
const canSeeDrafts = (ctx: ApiContext): boolean => {
  const role = roleOf(ctx.state.user);
  return role === ROLES.ADMIN || role === ROLES.CONTENT_MANAGER;
};

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
  /**
   * The whole draft/published requirement rests on the status line below.
   *
   * Strapi honours `?status=draft` from any caller with read permission, so a
   * logged-out visitor could otherwise request drafts directly. We overwrite the
   * parameter rather than reading it: for anyone but a blog author, status is
   * forced to 'published' regardless of what was asked for.
   *
   * The ?scope=mine branch queries directly for the same reason the course
   * controller does — `filters[author]` is rejected for a Content Manager,
   * because they have no permission to read users.
   */
  async find(ctx: ApiContext) {
    if (ctx.query.scope === 'mine' || ctx.query.scope === 'managed') {
      const user = ctx.state.user;
      if (!user) return ctx.forbidden('Authentication required');
      if (!canSeeDrafts(ctx)) return ctx.forbidden('Not permitted');

      // The matrix grants both Admin and Content Manager full blog management.
      const filters = {};

      /**
       * Asking for status 'draft' returns the draft version of every document,
       * and a draft version always has publishedAt = null — including for posts
       * that are live. So the published set is fetched separately and used to
       * decide each row's real state, rather than trusting the draft's own
       * publishedAt, which would mark everything as unpublished.
       */
      const [drafts, published] = await Promise.all([
        strapi.documents('api::post.post').findMany({
          filters,
          status: 'draft',
          populate: { author: { fields: ['id', 'username'] } },
          sort: 'updatedAt:desc',
          limit: -1,
        }),
        strapi.documents('api::post.post').findMany({
          filters,
          status: 'published',
          fields: ['documentId', 'publishedAt'],
          limit: -1,
        }),
      ]);

      const publishedAtById = new Map(
        published.map((p) => [p.documentId, p.publishedAt as string | null])
      );

      return {
        data: drafts.map((post) => ({
          documentId: post.documentId,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImageUrl: post.coverImageUrl,
          publishedAt: publishedAtById.get(post.documentId) ?? null,
          updatedAt: post.updatedAt,
          createdAt: post.createdAt,
          author: post.author,
        })),
      };
    }

    if (!canSeeDrafts(ctx)) {
      ctx.query = { ...ctx.query, status: 'published' };
    }
    return super.find(ctx);
  },

  async findOne(ctx: ApiContext) {
    if (!canSeeDrafts(ctx)) {
      ctx.query = { ...ctx.query, status: 'published' };
    }
    return super.findOne(ctx);
  },

  /**
   * Authorship is attached server-side through the Document Service — see the
   * note in the course controller for why it cannot travel in the request body.
   * New posts start as drafts; publishing is a separate, explicit action.
   */
  async create(ctx: ApiContext) {
    const user = ctx.state.user!;
    const input = bodyData(ctx);

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const body = typeof input.body === 'string' ? input.body : '';
    if (title.length === 0) return ctx.badRequest('A title is required');
    if (body.length === 0) return ctx.badRequest('A body is required');

    const slug =
      typeof input.slug === 'string' && input.slug.trim().length > 0
        ? slugify(input.slug)
        : `${slugify(title)}-${Date.now().toString(36)}`;

    const created = await strapi.documents('api::post.post').create({
      data: {
        title,
        slug,
        body,
        excerpt: typeof input.excerpt === 'string' ? input.excerpt : undefined,
        coverImageUrl: typeof input.coverImageUrl === 'string' ? input.coverImageUrl : undefined,
        author: user.id,
      },
      status: 'draft',
    });

    const sanitized = await strapi.contentAPI.sanitize.output(
      created,
      strapi.contentType('api::post.post'),
      { auth: ctx.state.auth }
    );
    return { data: sanitized };
  },

  async update(ctx: ApiContext) {
    // Reassigning authorship would let a Content Manager hand a post to someone
    // else and lose their own ownership check on it.
    stripProtectedFields(ctx, ['author']);
    return super.update(ctx);
  },

  /** POST /posts/:id/publish */
  async publish(ctx: ApiContext) {
    const post = await strapi.documents('api::post.post').publish({ documentId: ctx.params.id });
    if (!post) return ctx.notFound('Post not found');
    return { data: post };
  },

  /** POST /posts/:id/unpublish — returns a published post to draft. */
  async unpublish(ctx: ApiContext) {
    const post = await strapi.documents('api::post.post').unpublish({ documentId: ctx.params.id });
    if (!post) return ctx.notFound('Post not found');
    return { data: post };
  },
}));
