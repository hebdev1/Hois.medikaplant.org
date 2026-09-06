'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export default function ComparePicker({
  all,
  selected,
  max = 3,
}: {
  all: { slug: string; name_kr: string }[];
  selected: string[];
  max?: number;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '/laboratwa/konparezon';
  const params = useSearchParams();

  function setP(next: string[]) {
    const p = new URLSearchParams(params?.toString() ?? '');
    if (next.length) p.set('p', next.join(','));
    else p.delete('p');
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }
  const nameOf = (slug: string) => all.find((a) => a.slug === slug)?.name_kr ?? slug;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0' }}>
      {selected.map((s) => (
        <span key={s} className="lab-chip on" style={{ cursor: 'default' }}>
          {nameOf(s)}
          <button
            type="button"
            onClick={() => setP(selected.filter((x) => x !== s))}
            aria-label={`Retire ${nameOf(s)}`}
            style={{ all: 'unset', cursor: 'pointer', marginLeft: 6, display: 'inline-flex' }}
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        </span>
      ))}
      {selected.length < max && (
        <select
          className="lab-chip"
          style={{ paddingRight: 22 }}
          value=""
          onChange={(e) => {
            if (e.target.value) setP([...selected, e.target.value]);
          }}
          aria-label="Ajoute yon plant"
        >
          <option value="">+ Ajoute yon plant…</option>
          {all
            .filter((a) => !selected.includes(a.slug))
            .map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name_kr}
              </option>
            ))}
        </select>
      )}
    </div>
  );
}
