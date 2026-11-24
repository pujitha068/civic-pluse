import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'CivicPulse — Real-Time Societal Resilience Studio',
  description:
    'Monitor real-time urban air quality, clean water networks, emergency dispatch, and clean energy grid stability with live civic reporting.',
  openGraph: {
    title: 'CivicPulse — Real-Time Societal Resilience Studio',
    description:
      'Monitor real-time urban air quality, clean water networks, emergency dispatch, and clean energy grid stability with live civic reporting.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-sky-600/20">
        {children}
      </body>
    </html>
  );
}
