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
  // NB: we tried output: 'standalone' for one deploy and got 503s on
  // Hostinger because the panel's pre-baked start command was still
  // `next start`, which doesn't know how to serve the standalone
  // bundle's relocated chunks. Keep the default output mode and let
  // `npm start` (which proxies to `next start`) do the right thing
  // against `.next/`. Re-enabling standalone is fine later IF you also
  // change Hostinger's start command to
  //   node .next/standalone/server.js
  // and copy `public/` + `.next/static/` into `.next/standalone/`
  // after each build (a postbuild script).

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
