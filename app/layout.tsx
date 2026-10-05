import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import TranslateSwitcher from '@/components/translate-switcher';
import RemedFinder from '@/components/remed-finder/remed-finder';
import GoogleAnalytics from '@/components/analytics/google-analytics';

// Fonts are trimmed for speed: DM_Sans (body) + Playfair (display) are used
// site-wide and preload; Lora (serif accents, a handful of spots) loads only
// where it's used. Poppins was only a sans fallback — dropped. Italics use the
// browser's synthesized slant, so we don't ship italic font files.
// Every font is self-hosted from app/fonts (the same latin files Google Fonts
// serves) so the build never downloads from Google: next/font/google fails the
// build ("Cannot read properties of null (reading '1')") whenever Google
// answers with a font URL that has no file extension.
const playfair = localFont({
  src: './fonts/playfair-display-latin-wght-normal.woff2',
  weight: '400 800',
  style: 'normal',
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const lora = localFont({
  src: './fonts/lora-latin-wght-normal.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-lora',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

const dmSans = localFont({
  src: './fonts/dm-sans-latin-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Hoïs Inivèsite | Naturopathic Wellness from Haiti',
    template: '%s · Hoïs Inivèsite',
  },
  description:
    'Hoïs Inivèsite pwopoze remèd fèy, swen natirèl, ak kominote VIP Hoïs pou byennèt fizik ak espirityèl ou. Plant-based wellness, naturopathic remedies, and traditional Haitian medicine.',
  keywords: [
    'MedikaPlant',
    'Hoïs',
    'naturopathy',
    'remèd fèy',
    'Haiti wellness',
    'plant medicine',
    'traditional Haitian medicine',
  ],
  openGraph: {
    title: 'Hoïs Inivèsite',
    description:
      'Plant-based wellness, naturopathic remedies, and a VIP community rooted in Haitian tradition.',
    url: 'https://hoismedikaplant.com',
    siteName: 'MedikaPlant',
    locale: 'ht_HT',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    title: 'Hoïs',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#14361f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ht"
      className={`${playfair.variable} ${lora.variable} ${dmSans.variable}`}
    >
      <body className="font-sans antialiased bg-white text-ink">
        {children}
        <TranslateSwitcher />
        <RemedFinder />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
