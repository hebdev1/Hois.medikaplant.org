import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hoismedikaplant.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/api',
        // The plant explorer's filter combinations (?pati=…&prep=…&sezon=…) are
        // an endless URL space; crawlers walking it re-rendered the page ~240×/h.
        // The bare /laboratwa/eksplorate stays crawlable.
        '/laboratwa/eksplorate?',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
