import type { Metadata, Viewport } from 'next';
import { DM_Serif_Display, IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/mission';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const dmSerif = DM_Serif_Display({ variable: '--font-dm-serif', subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap' });
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['400', '500'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'ORBITAL — Beyond the Known · Expedition Vesper', template: '%s · ORBITAL' },
  description: SITE.description,
  applicationName: 'ORBITAL',
  keywords: ['interstellar mission', 'Expedition Vesper', 'ORION-01', 'space exploration', 'Calder', 'design fiction'],
  openGraph: {
    type: 'website',
    title: 'ORBITAL — Beyond the Known',
    description: 'The first crewed voyage to another star: Expedition Vesper, a design-fiction mission to the ocean world Calder.',
    siteName: 'ORBITAL',
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: 'ORBITAL — Beyond the Known', description: 'Expedition Vesper: the first crewed voyage to another star (design fiction).' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050914',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${dmSerif.variable} ${plexMono.variable} is-loading`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
