'use client';

import React from 'react';
import { Globe, Check } from 'lucide-react';

// ───────────────────────────────────────────────────────────────────────────
// Floating language switcher.
//
// Strategy: we drive a HIDDEN Google Translate widget. The widget injects a
// <select class="goog-te-combo"> into the DOM with all the supported
// language codes. To translate, we set that select's value to a code and
// dispatch a `change` event — Google handles the rest in-place, no full
// page reload, no navigation.
//
// Why Google Translate vs. a real i18n refactor (next-intl, etc.):
//   • Zero refactor. Every page, every dynamic string, every server-
//     rendered Kreyòl word in the DB gets translated for free.
//   • Survives navigation: Google sets the `googtrans` cookie, so the
//     translation persists across SPA + server-rendered pages.
//   • The trade-off is machine quality — acceptable for HT→FR→EN given
//     the site is content-heavy Kreyòl that's expensive to translate by
//     hand and the audience is bilingual to begin with.
//
// CSS overrides in globals.css hide the default Google banner + button
// styling so the experience feels native.
// ───────────────────────────────────────────────────────────────────────────

type LangCode = 'ht' | 'fr' | 'en';

type LangOption = {
  code: LangCode;
  label: string;
  flag: string;
  /** Code used by Google's combo. Identical to `code` for us. */
  google: string;
};

const LANGS: LangOption[] = [
  { code: 'ht', label: 'Kreyòl', flag: '🇭🇹', google: 'ht' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', google: 'fr' },
  { code: 'en', label: 'English', flag: '🇺🇸', google: 'en' },
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
              layout?: number;
              autoDisplay?: boolean;
            },
            elementId: string
          ): unknown;
          InlineLayout?: { SIMPLE: number; HORIZONTAL: number; VERTICAL: number };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function readActiveLang(): LangCode {
  if (typeof document === 'undefined') return 'ht';
  // Google sets googtrans to "/ht/fr" or "/auto/fr" once translated.
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return 'ht';
  const raw = decodeURIComponent(match[1]);
  // raw looks like "/ht/fr" — take the trailing target.
  const parts = raw.split('/').filter(Boolean);
  const target = parts[parts.length - 1];
  if (target === 'fr' || target === 'en' || target === 'ht') return target;
  return 'ht';
}

function setLangCookie(target: LangCode) {
  // Google reads both googtrans cookies on the bare domain and on the host —
  // setting both makes the translation stick across subpath nav + reloads.
  const value = encodeURIComponent(`/ht/${target}`);
  document.cookie = `googtrans=${value}; path=/; max-age=31536000`;
  const host = window.location.hostname;
  // For yourdomain.com cookies (cross-subdomain), also set with leading dot.
  if (host.split('.').length >= 2) {
    const apex = host.replace(/^(www|app|admin)\./, '');
    document.cookie = `googtrans=${value}; path=/; domain=.${apex}; max-age=31536000`;
  }
}

function clearLangCookie() {
  document.cookie = 'googtrans=; path=/; max-age=0';
  const host = window.location.hostname;
  if (host.split('.').length >= 2) {
    const apex = host.replace(/^(www|app|admin)\./, '');
    document.cookie = `googtrans=; path=/; domain=.${apex}; max-age=0`;
  }
}

export default function TranslateSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<LangCode>('ht');
  const [ready, setReady] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // ── Inject Google Translate script once on mount ───────────────────────
  React.useEffect(() => {
    // Already loaded by another mount or HMR? Skip duplicate.
    if (document.getElementById('google-translate-script')) {
      setReady(true);
      return;
    }

    // The widget calls `window.googleTranslateElementInit` on load. We
    // attach the callback BEFORE injecting the script so the race is safe.
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
        setReady(true);
      } catch {
        // Best-effort — if the widget fails to init, the dropdown still
        // renders, it just won't translate. We swallow rather than crash.
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Restore previously-selected language from cookie
    setActive(readActiveLang());
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
    setActive(target);
    setOpen(false);

    if (target === 'ht') {
      // Going back to source language — clear cookie + reload so Google's
      // injected translations get fully unwound. (The widget itself
      // doesn't expose a clean "revert" hook.)
      clearLangCookie();
      window.location.reload();
      return;
    }

    setLangCookie(target);

    // Drive the hidden Google combo via change event so the widget
    // immediately translates the visible page without a navigation.
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = target;
      combo.dispatchEvent(new Event('change'));
    } else {
      // Combo not ready yet — reload so Google picks up the cookie on
      // boot and renders the translated page from the start.
      window.location.reload();
    }
  }

  const activeLang = LANGS.find((l) => l.code === active) ?? LANGS[0];

  return (
    <>
      {/* The Google widget gets parented here. It is sized to 0 so it stays
          invisible — our own dropdown drives it via the hidden <select>. */}
      <div
        id="google_translate_element"
        aria-hidden
        className="!w-0 !h-0 !overflow-hidden absolute -left-[9999px] top-0 pointer-events-none"
        // The `notranslate` class on a parent would block Google from
        // touching descendant text — we explicitly DO NOT add it here.
      />

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

        {!ready && (
          <span className="sr-only" aria-live="polite">
            Tradiksyon ap chaje…
          </span>
        )}
      </div>
    </>
  );
}
