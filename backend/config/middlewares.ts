import type { Core } from '@strapi/strapi';

/**
 * The default `strapi::cors` allows every origin. We replace it with an explicit
 * allowlist: only our local dev server and the deployed Vercel frontend may call
 * this API from a browser.
 *
 * FRONTEND_URL is set per-environment (Railway variable in production) and must
 * not carry a trailing slash — the Origin header never has one, so it would not match.
 */
const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        process.env.FRONTEND_URL ?? 'http://localhost:3000',
        'http://localhost:3000',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
