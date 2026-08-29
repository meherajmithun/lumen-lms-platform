import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Railway terminates TLS at its public proxy and forwards the request to
  // Strapi over the private network. Trust its X-Forwarded-Proto header in
  // production so Koa knows the original request was HTTPS; otherwise Strapi's
  // refresh-session login fails while setting a secure cookie.
  proxy: {
    koa: env.bool('PROXY_KOA', false),
  },
  // Set to the Railway domain in production so the admin panel emits absolute URLs
  // that match the public origin. Without it, admin assets 404 behind the proxy.
  url: env('PUBLIC_URL', undefined),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
