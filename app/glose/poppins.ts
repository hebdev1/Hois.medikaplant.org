import localFont from 'next/font/local';

// Poppins, per the brief — shared by the glossary pages and scoped to them via
// the --font-poppins variable their CSS reads. Self-hosted from app/fonts — see
// the note in app/layout.tsx.
export const poppins = localFont({
  src: [
    { path: '../fonts/poppins-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/poppins-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/poppins-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/poppins-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../fonts/poppins-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/poppins-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../fonts/poppins-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/poppins-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-poppins',
  display: 'swap',
});
