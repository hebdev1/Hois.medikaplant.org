import type { MetadataRoute } from 'next';

// Web app manifest → makes Hoïs installable ("Add to Home Screen") as a
// standalone app. No offline service worker yet (that needs on-device testing);
// this is the safe installability + branding layer.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hoïs Inivèsite',
    short_name: 'Hoïs',
    description: 'Klas, swivi sante, ak kominote Hoïs — nan pwòp rit ou.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf7ef',
    theme_color: '#14361f',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
