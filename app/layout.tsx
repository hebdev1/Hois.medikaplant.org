import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './fonts/site-fonts.css';
import TranslateSwitcher from '@/components/translate-switcher';
import RemedFinder from '@/components/remed-finder/remed-finder';
import GoogleAnalytics from '@/components/analytics/google-analytics';

// DM Sans (body) + Playfair Display (display) are used site-wide and preload;
// Lora (serif accents, a handful of spots) loads only where it's used. The root
// fonts ship upright files only — italics use the browser's synthesized slant.
//
// Fonts are self-hosted from app/fonts (scripts/vendor-fonts.mjs) because
// next/font/google fails the production build ("Cannot read properties of
// null (reading '1')") whenever Google answers with a font URL that has no
// file extension. Each localFont() declares a family's latin file under its
// real name; fonts/<scope>-fonts.css adds the family's other subsets and its
// fallback face, so the output matches what next/font/google generated.
const playfair = localFont({
  src: './fonts/playfair-display-latin-wght-normal.woff2',
  weight: '400 800',
  variable: '--font-playfair',
  display: 'swap',
  declarations: [{ prop: 'font-family', value: "'Playfair Display'" }],
  fallback: ["'Playfair Display Fallback'"],
  adjustFontFallback: false,
});

const lora = localFont({
  src: './fonts/lora-latin-wght-normal.woff2',
  weight: '400 600',
  variable: '--font-lora',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'font-family', value: "'Lora'" }],
  fallback: ["'Lora Fallback'"],
  adjustFontFallback: false,
});

const dmSans = localFont({
  src: './fonts/dm-sans-latin-wght-normal.woff2',
  weight: '400 700',
  variable: '--font-dm-sans',
  display: 'swap',
  declarations: [{ prop: 'font-family', value: "'DM Sans'" }],
  fallback: ["'DM Sans Fallback'"],
  adjustFontFallback: false,
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
