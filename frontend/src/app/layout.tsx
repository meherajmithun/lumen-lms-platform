import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
  axes: ['wdth'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  title: {
    default: 'Lumen — learn one lesson at a time',
    template: '%s · Lumen',
  },
  description:
    'A learning platform built around sequence and progress: ordered lessons, a visible spine of what you have finished, and quizzes graded the moment you submit.',
  openGraph: {
    type: 'website',
    siteName: 'Lumen',
    url: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={openSans.variable}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
