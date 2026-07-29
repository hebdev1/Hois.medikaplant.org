'use client';

import { useEffect, useRef, useState } from 'react';

// Renders a full, self-contained course page (its own <style>, fonts, layout
// and — for our own compiled pages — a bundled React runtime for interactive
// tabs/quizzes) inside an isolated iframe so nothing leaks either way.
//
// `html` is either a same-origin URL/path to a static HTML file we built
// (trusted → scripts allowed) or a raw HTML string pasted in the admin
// (untrusted → scripts withheld). Height tracks the content so the whole
// course scrolls as one page with no inner scrollbar.
export default function CoursePageFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1400);
  const value = html.trim();
  const isUrl = value.startsWith('/') || /^https?:\/\//i.test(value);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let observer: ResizeObserver | null = null;

    function attach() {
      try {
        const doc = iframe!.contentDocument;
        if (!doc?.body) return;
        const measure = () =>
          setHeight(
            Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
          );
        measure();
        // The bundled course app re-renders on tab/quiz interaction, which
        // changes the height — keep the frame in step.
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
      } catch {
        /* cross-origin — cannot measure; leave the fallback height */
      }
    }

    iframe.addEventListener('load', attach);
    if (iframe.contentDocument?.readyState === 'complete') attach();
    return () => {
      iframe.removeEventListener('load', attach);
      observer?.disconnect();
    };
  }, [value]);

  return (
    <iframe
      ref={ref}
      {...(isUrl ? { src: value } : { srcDoc: value })}
      title="Paj konplè kou a"
      // Trusted compiled pages run their scripts; pasted HTML never does.
      sandbox={isUrl ? 'allow-scripts allow-same-origin' : 'allow-same-origin'}
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  );
}
