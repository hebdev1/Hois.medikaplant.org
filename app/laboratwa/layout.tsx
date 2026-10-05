import localFont from 'next/font/local';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import './laboratwa.css';

// Handoff §2 typography: Petrona (display), Archivo (body/UI), IBM Plex Mono
// (quantities + labels). Explicitly NOT Playfair / Inter / Fraunces.
// Self-hosted from app/fonts — see the note in app/layout.tsx.
const petrona = localFont({
  src: [
    { path: '../fonts/petrona-latin-wght-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/petrona-latin-wght-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/petrona-latin-wght-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/petrona-latin-wght-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-petrona',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
const archivo = localFont({
  src: '../fonts/archivo-latin-wght-normal.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-archivo',
  display: 'swap',
});
const mono = localFont({
  src: '../fonts/ibm-plex-mono-latin-500-normal.woff2',
  weight: '500',
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
});

export default function LaboratwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PromoteHeader />
      <div className={`lab ${petrona.variable} ${archivo.variable} ${mono.variable}`}>
        <div className="lab-fil" />
        {children}
      </div>
      <Footer />
    </>
  );
}
