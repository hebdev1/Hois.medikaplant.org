'use client';

import React from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Share the daily advice. Uses the Web Share API on mobile (where
 * `navigator.share` is available — Android Chrome, iOS Safari) and
 * falls back to clipboard copy on desktop browsers. Either way the
 * member never sees a non-functional button.
 *
 * `bodyHtml` is the raw advice HTML from the DB; we strip tags so the
 * shared text is clean plain text suitable for WhatsApp/SMS/email.
 */
export default function ShareAdviceButton({
  bodyHtml,
  plant,
  date,
}: {
  bodyHtml: string;
  plant: string;
  date: string;
}) {
  const [copied, setCopied] = React.useState(false);

  function buildShareText() {
    const plainBody = stripHtml(bodyHtml).trim();
    const url =
      typeof window !== 'undefined' ? window.location.origin : 'https://hoismedikaplant.com';
    return `🌿 Konsèy plant jou a — ${date}\n\n${plainBody}\n\n${plant}\n\n${url}`;
  }

  async function onShare() {
    const text = buildShareText();
    const title = `Konsèy plant jou a — ${date}`;

    // 1) Native share sheet (mobile)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // User dismissed — silent.
      }
    }

    // 2) Clipboard fallback (desktop)
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last resort: legacy execCommand fallback
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        /* nothing else we can do */
      }
      document.body.removeChild(el);
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Pataje konsèy jou a"
      className={cn(
        'inline-flex items-center gap-2 border text-sm font-medium px-4 py-2.5 rounded-full transition',
        copied
          ? 'border-forest-300 bg-forest-50 text-forest-800'
          : 'border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700'
      )}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
          Kopye!
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
          Pataje
        </>
      )}
      {!copied && (
        <Copy
          aria-hidden
          className="hidden sm:block w-3 h-3 text-earth-400"
          strokeWidth={2}
        />
      )}
    </button>
  );
}

function stripHtml(html: string): string {
  // Conservative tag strip — keeps text content, decodes the few entities
  // we actually use in advice bodies.
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n');
}
