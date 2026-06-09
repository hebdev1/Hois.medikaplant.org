'use client';

import React from 'react';
import { Globe, Check } from 'lucide-react';

// ───────────────────────────────────────────────────────────────────────────
// Floating language switcher.
//
// Strategy: drive a HIDDEN Google Translate widget — but only when the user
// has explicitly opted-in. The widget is loaded lazily based on the
// `googtrans` cookie: if it says "fr" or "en", the script is injected on
// mount; if it's absent or says "ht", we render only our own button and
// never touch the page DOM. This is critical because Google Translate
// rewrites text nodes with <font> wrappers, and that mutation breaks
// React's reconciliation in client components — the admin bell, the user
// dashboard, anything with realtime updates. Keeping Kreyòl as a pure
// React render path avoids the entire class of bug for the 95% of users
// who never switch languages.
//
// When a user does switch, we always do a full reload so Google can boot
// against the static HTML rather than mutate a hydrated DOM mid-flight.
// ───────────────────────────────────────────────────────────────────────────

type LangCode = 'ht' | 'fr' | 'en';

type LangOption = {
  code: LangCode;
  label: string;
  flag: string;
};

const LANGS: LangOption[] = [
  { code: 'ht', label: 'Kreyòl', flag: '🇭🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages?: string;
              autoDisplay?: boolean;
            },
            elementId: string
          ): unknown;
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function readActiveLang(): LangCode {
  if (typeof document === 'undefined') return 'ht';
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return 'ht';
  const raw = decodeURIComponent(match[1]);
  const parts = raw.split('/').filter(Boolean);
  const target = parts[parts.length - 1];
  if (target === 'fr' || target === 'en') return target;
  return 'ht';
}

function writeLangCookie(target: LangCode) {
  // Source-language Kreyòl is just "no cookie" — Google reads the absence
  // as "leave the page alone".
  if (target === 'ht') {
    document.cookie = 'googtrans=; path=/; max-age=0';
    const host = window.location.hostname;
    if (host.split('.').length >= 2) {
      const apex = host.replace(/^(www|app|admin)\./, '');
      document.cookie = `googtrans=; path=/; domain=.${apex}; max-age=0`;
    }
    return;
  }

  const value = encodeURIComponent(`/ht/${target}`);
  document.cookie = `googtrans=${value}; path=/; max-age=31536000`;
  const host = window.location.hostname;
  if (host.split('.').length >= 2) {
    const apex = host.replace(/^(www|app|admin)\./, '');
    document.cookie = `googtrans=${value}; path=/; domain=.${apex}; max-age=31536000`;
  }
}

/**
 * Inject the Google Translate element script + its host div. Idempotent —
 * a second call short-circuits. Wrapped in try/catch so a CSP block or a
 * 3rd-party blocker never crashes the rest of the app.
 */
function ensureGoogleWidget() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('google-translate-script')) return;

  try {
    // Host div the widget binds to. Lives off-screen + zero-sized so we
    // only use the underlying .goog-te-combo, never Google's UI chrome.
    if (!document.getElementById('google_translate_element')) {
      const host = document.createElement('div');
      host.id = 'google_translate_element';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText =
        'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;pointer-events:none;';
      document.body.appendChild(host);
    }

    window.googleTranslateElementInit = () => {
      try {
        const TE = window.google?.translate?.TranslateElement;
        if (!TE) return;
        new TE(
          {
            pageLanguage: 'ht',
            includedLanguages: 'fr,en,ht',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      } catch {
        // Best-effort: widget failure must never crash the host app.
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => {
      /* swallow */
    };
    document.body.appendChild(script);
  } catch {
    /* Best-effort: never crash the host app. */
  }
}

export default function TranslateSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<LangCode>('ht');
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Restore previously-selected language from cookie + load the widget
  // ONLY if the user has already opted in. Fresh Kreyòl visitors get a
  // pristine React tree with zero Google involvement, which avoids the
  // DOM-mutation × React-reconciliation class of bugs entirely.
  React.useEffect(() => {
    const current = readActiveLang();
    setActive(current);
    if (current !== 'ht') {
      ensureGoogleWidget();
    }
  }, []);

  // ── Click-outside to close ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function pick(target: LangCode) {
    setOpen(false);
    if (target === active) return;

    // Always persist + reload. We deliberately avoid mid-flight DOM
    // mutation: Google should boot against the freshly-rendered HTML,
    // never against a hydrated React tree. This eliminates the
    // "removeChild on Node" class of crashes that plague React + Google
    // Translate integrations.
    writeLangCookie(target);
    setActive(target);
    window.location.reload();
  }

  const activeLang = LANGS.find((l) => l.code === active) ?? LANGS[0];

  return (
    <div
      ref={dropdownRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] notranslate"
      translate="no"
    >
      {open && (
        <div className="absolute bottom-14 right-0 w-44 bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-500">
            Langue / Lang
          </div>
          <ul>
            {LANGS.map((lang) => {
              const selected = lang.code === active;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    onClick={() => pick(lang.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition text-left ${
                      selected
                        ? 'bg-forest-50 text-forest-900'
                        : 'hover:bg-cream-50 text-ink'
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {lang.flag}
                    </span>
                    <span className="flex-1">{lang.label}</span>
                    {selected && (
                      <Check
                        className="w-4 h-4 text-forest-600"
                        strokeWidth={2.4}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-3 py-2 border-t border-cream-100 text-[10px] text-earth-500">
            Tradiksyon otomatik · Google
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chanje langue / Change language"
        aria-expanded={open}
        className="group grid grid-flow-col auto-cols-min gap-2 items-center px-3 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 shadow-lg border border-forest-600 transition"
      >
        <Globe
          className="w-4 h-4 group-hover:rotate-12 transition"
          strokeWidth={2.2}
        />
        <span className="text-xs font-bold uppercase tracking-wider">
          {activeLang.code.toUpperCase()}
        </span>
      </button>
    </div>
  );
}
