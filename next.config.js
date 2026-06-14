/** @type {import('next').NextConfig} */
// ───────────────────────────────────────────────────────────────────────────
// Next.js config tuned for Hostinger Node.js Apps deployment.
//
// Why each setting matters here (vs. Vercel where defaults Just Work):
//
//   output: 'standalone'
//     Builds a self-contained server in `.next/standalone/` that only
//     depends on the files Next.js actually needs at runtime. Avoids the
//     "raw / unstyled site after deploy" failure mode that Hostinger
//     hits when the panel's reverse proxy can't find static chunks.
//     The standalone bundle includes a server.js entry that exposes
//     PORT/HOST env vars Hostinger sets automatically.
//
//   images.remotePatterns
//     Loud allow-list for next/image. Without these entries any external
//     image (Unsplash, Pexels, Supabase Storage) returns 400 from
//     /_next/image and shows a broken-image icon on every card.
//     Hostinger's panel doesn't always support next/image optimization
//     — if images still don't render after deploy, flip
//     `images.unoptimized` to `true` to bypass the optimizer.
//
//   poweredByHeader / compress
//     Trim the runtime footprint slightly + drop the "X-Powered-By:
//     Next.js" tell. Tiny wins but they add up on shared hosting.
//
//   reactStrictMode
//     Already the Next 14 default but pinning it here keeps behavior
//     identical between Vercel + Hostinger + local dev.
// ───────────────────────────────────────────────────────────────────────────
const nextConfig = {
  // Standalone output mode — required for reliable Hostinger deploys.
  // The build emits `.next/standalone/server.js`; the start command
  // should be `node .next/standalone/server.js`. We also keep
  // `npm start` working (next start) so local production previews are
  // unaffected.
  output: 'standalone',

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'kmzmtuthwssyuoklmydy.supabase.co' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'medikaplantshop.com' },
    ],
  },

  // Skip the build-time TypeScript + ESLint gates only as a last-resort
  // safety net. We DON'T set these to true here — the build should
  // surface real errors during CI. Flip them if a deploy is blocked by
  // an irrelevant lint warning and you need to ship.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

module.exports = nextConfig;
