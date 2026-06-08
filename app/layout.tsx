import type { Metadata } from 'next';
import { Poppins, Playfair_Display, Lora, DM_Sans } from 'next/font/google';
import './globals.css';
import TranslateSwitcher from '@/components/translate-switcher';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MedikaPlant — Hoïs Inivèsite | Naturopathic Wellness from Haiti',
    template: '%s · MedikaPlant',
  },
  description:
    'MedikaPlant pwopoze remèd fèy, swen natirèl, ak kominote VIP Hoïs pou byennèt fizik ak espirityèl ou. Plant-based wellness, naturopathic remedies, and traditional Haitian medicine.',
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
    title: 'MedikaPlant — Hoïs Inivèsite',
    description:
      'Plant-based wellness, naturopathic remedies, and a VIP community rooted in Haitian tradition.',
    url: 'https://hois.medikaplant.org',
    siteName: 'MedikaPlant',
    locale: 'ht_HT',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ht"
      className={`${poppins.variable} ${playfair.variable} ${lora.variable} ${dmSans.variable}`}
    >
      <body className="font-sans antialiased bg-white text-ink">
        {children}
        <TranslateSwitcher />
      </body>
    </html>
  );
}
