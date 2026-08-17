'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// Google Analytics 4. The measurement ID is public (it ships in the page for
// every GA-tracked site), so it's fine as a default — the site tracks with no
// extra config on the server. Override with NEXT_PUBLIC_GA_ID if it ever
// changes. Only runs in production so local dev doesn't pollute the data.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-WVDQW34YM2';

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (!w.gtag) return;
    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // We disabled GA's automatic page_view (send_page_view:false) so SPA
    // navigations don't double-count — send exactly one here per route.
    w.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);
  return null;
}

export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
