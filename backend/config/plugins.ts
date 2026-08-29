import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      // Next.js owns the browser session and stores this JWT in its own
      // httpOnly cookie for at most seven days. Refresh mode issues a short-lived
      // access token, but the frontend never receives/retains Strapi's refresh
      // cookie on its server-to-server login request; users would therefore be
      // redirected to sign-in when navigating to a freshly rendered page. A
      // legacy plugin JWT lasts 30 days by Strapi default, while our Next cookie
      // remains the stricter seven-day limit.
      jwtManagement: 'legacy-support',
      sessions: {
        httpOnly: false,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },
});

export default config;
