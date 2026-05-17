import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
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
    <html lang="ht" className={poppins.variable}>
      <body className="font-sans antialiased bg-white text-ink">{children}</body>
    </html>
  );
}
