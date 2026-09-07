import * as React from 'react';
import Link from 'next/link';
import LangSwitch from './lang-switch';

// Shared presentational pieces for the Laboratwa. No 'use client' — plain, so
// server components render them and the (few) client components can import them
// too.

/** The signature element: every quantity, measure and duration wears this. */
export function Qty({ children }: { children: React.ReactNode }) {
  return <span className="lab-qty">{children}</span>;
}

const DISC_LONG =
  'Enfòmasyon sa a se pou edikasyon sèlman. FDA pa evalye deklarasyon sa yo. Laboratwa a pa bay preskripsyon, pa bay doz, epi li pa ranplase yon pwofesyonèl sante.';
const DISC_SHORT =
  'Edikasyon sèlman. FDA pa evalye deklarasyon sa yo. Nou pa bay doz ni preskripsyon.';

export function Disclaimer({ short = false }: { short?: boolean }) {
  return (
    <div className="lab-disc">
      <b>Avètisman</b>
      {short ? DISC_SHORT : DISC_LONG}
    </div>
  );
}

/** Header for every Laboratwa screen. Entry page gets the brand + nav; tool
 *  pages pass a `back` link instead. The language switch sits at the right. */
export function LabHeader({
  lang,
  back,
  nav = false,
}: {
  lang: string;
  back?: { href: string; label: string };
  nav?: boolean;
}) {
  return (
    <div className="lab-head">
      {back ? (
        <Link href={back.href} className="lab-back">
          ‹ {back.label}
        </Link>
      ) : (
        <Link href="/laboratwa" className="lab-brand" style={{ textDecoration: 'none' }}>
          HOIS MEDIKAPLANT
        </Link>
      )}
      {nav ? (
        <nav className="lab-nav" aria-label="Laboratwa">
          <Link href="/laboratwa/eksplorate">Eksplorate</Link>
          <Link href="/laboratwa/konparezon">Konparezon</Link>
          <Link href="/laboratwa/kalendriye">Kalendriye</Link>
          <Link href="/laboratwa/maladi">Maladi</Link>
        </nav>
      ) : (
        <span />
      )}
      <LangSwitch current={lang} />
    </div>
  );
}

/** Normalize the ?lang search param to one of kr|fr|en (kr default). */
export function readLang(sp?: { lang?: string }): 'kr' | 'fr' | 'en' {
  const l = sp?.lang;
  return l === 'fr' || l === 'en' ? l : 'kr';
}
