'use client';

import { useRef, useState } from 'react';

// Renders a full, self-contained course landing page (its own <style>, fonts
// and layout) inside an isolated iframe so its CSS can never leak into — or be
// stripped by — the host app. The frame stays same-origin, which lets us read
// the content height and grow it to fit (no inner scrollbar).
//
// `html` is either a same-origin URL/path to a static HTML file (e.g. a
// designer-built page committed under /public) or a raw HTML string pasted in
// the admin. Both render the same way; only the iframe source differs.
export default function CoursePageFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);
  const value = html.trim();
  const isUrl = value.startsWith('/') || /^https?:\/\//i.test(value);

  function fit() {
    try {
      const doc = ref.current?.contentDocument;
      if (doc?.body) setHeight(doc.body.scrollHeight + 24);
    } catch {
      /* cross-origin guard — ignore */
    }
  }

  return (
    <iframe
      ref={ref}
      {...(isUrl ? { src: value } : { srcDoc: value })}
      title="Paj konplè kou a"
      loading="lazy"
      // allow-same-origin lets us measure height; withholding allow-scripts
      // means no pasted <script> can ever run — content + CSS only.
      sandbox="allow-same-origin"
      onLoad={() => {
        fit();
        // Fonts/images can reflow after load; re-measure a couple of times.
        setTimeout(fit, 400);
        setTimeout(fit, 1500);
      }}
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  );
}
