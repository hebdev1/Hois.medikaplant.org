'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

// KR · FR · EN. Kreyòl is the reference; the switch persists in the URL so a
// language choice is shareable. Plant names are never translated — the switch
// only changes which alternate name a page emphasizes.
const LANGS = ['kr', 'fr', 'en'] as const;

export default function LangSwitch({ current }: { current: string }) {
  const pathname = usePathname() ?? '/laboratwa';
  const params = useSearchParams();

  function href(l: string) {
    const p = new URLSearchParams(params?.toString() ?? '');
    if (l === 'kr') p.delete('lang');
    else p.set('lang', l);
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="lab-lang" role="group" aria-label="Chwazi lang">
      {LANGS.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span aria-hidden style={{ color: 'rgba(22,38,28,.2)' }}>·</span>}
          <Link
            href={href(l)}
            className={current === l ? 'on' : ''}
            aria-current={current === l ? 'true' : undefined}
          >
            {l.toUpperCase()}
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
}
