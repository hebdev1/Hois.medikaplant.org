'use server';

// Server action so the client header (promote-header) can read the same
// cached, fallback-safe site chrome the server footer uses.

import { getSiteChrome, type SiteChrome } from '@/lib/site-chrome';

export async function getPublicChrome(): Promise<SiteChrome> {
  return getSiteChrome();
}
