import { Petrona, Archivo, IBM_Plex_Mono } from 'next/font/google';
import './laboratwa.css';

// Handoff §2 typography: Petrona (display), Archivo (body/UI), IBM Plex Mono
// (quantities + labels). Explicitly NOT Playfair / Inter / Fraunces.
const petrona = Petrona({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-petrona',
  display: 'swap',
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-archivo',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
  display: 'swap',
});

export default function LaboratwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`lab ${petrona.variable} ${archivo.variable} ${mono.variable}`}>
      <div className="lab-fil" />
      {children}
    </div>
  );
}
