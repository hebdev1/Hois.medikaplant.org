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

  // Security headers applied to every response. Kept intentionally
  // conservative so nothing breaks:
  //   • X-Frame-Options SAMEORIGIN + CSP frame-ancestors 'self' — block
  //     external clickjacking, while still allowing our own same-origin
  //     course iframe (CoursePageFrame src=/kou/*.html).
  //   • nosniff / Referrer-Policy / HSTS / Permissions-Policy — standard.
  //   • The CSP is limited to frame-ancestors/base-uri/object-src on
  //     purpose: a full script-src/style-src policy needs per-service
  //     allow-listing (Stripe, Supabase) + nonces and must be tested
  //     separately before it's turned on, or it breaks the app.
  async headers() {
    return [
      {
        // The embeddable Doktè Maton widget is loaded cross-origin from the
        // WooCommerce shop (medikaplantshop.com). Keep its edge/browser cache
        // SHORT so position/behaviour updates reach the shop within ~1 min
        // instead of being pinned to the old 4-hour TTL. CORS '*' lets other
        // origins fetch it too (script tags don't need it, but it's harmless).
        source: '/dokte-maton.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
          },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },

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

  // TypeScript still gates the build (real type errors fail it). ESLint is
  // now configured (.eslintrc.json) and runs via `npm run lint`, but we DON'T
  // let it fail the production build: the codebase predates the lint setup and
  // carries intentional warnings (e.g. <img> for chat/avatars, `any` casts for
  // stale Supabase types). tsc is the real correctness gate; lint is advisory.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
