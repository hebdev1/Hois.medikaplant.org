'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Loader2,
  Pencil,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { createPage, deletePage } from './actions';

type PageRow = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  updated_at: string;
};

export default function PagesList({ pages }: { pages: PageRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onNew() {
    setCreating(true);
    setErr(null);
    const res = await createPage();
    setCreating(false);
    if (res.ok && res.id) router.push(`/admin/pages/${res.id}`);
    else setErr(res.error ?? 'Echwe.');
  }

  async function onDelete(id: string) {
    setBusyId(id);
    const res = await deletePage(id);
    setBusyId(null);
    setConfirmId(null);
    if (res.ok) router.refresh();
    else setErr(res.error ?? 'Echwe.');
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" strokeWidth={2.2} />
            Paj
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Paj yo
          </h1>
          <p className="mt-1.5 text-sm text-earth-600">
            {pages.length} paj · konstwi ak blòk, pibliye sou /paj/&lt;slug&gt;
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.6} />
          )}
          Nouvo paj
        </button>
      </header>

      {err && (
        <div className="mb-4 text-sm rounded-xl px-3.5 py-2.5 border bg-rose-50 border-rose-200 text-rose-800">
          {err}
        </div>
      )}

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {pages.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen paj. Klike “Nouvo paj” pou kòmanse.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {pages.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-cream-50/60 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">
                      {p.title}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-earth-500 font-mono truncate">
                    /paj/{p.slug}
                  </div>
                </div>

                {p.status === 'published' && (
                  <a
                    href={`/paj/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 px-2 py-1"
                  >
                    Wè <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
                  </a>
                )}
                <Link
                  href={`/admin/pages/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Modifye
                </Link>

                {confirmId === p.id ? (
                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      disabled={busyId === p.id}
                      className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      {busyId === p.id ? '…' : 'Konfime'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="text-xs text-earth-500 px-1.5"
                    >
                      Anile
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(p.id)}
                    aria-label="Efase"
                    className="grid place-items-center w-8 h-8 rounded-lg text-earth-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return status === 'published' ? (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700">
      Pibliye
    </span>
  ) : (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">
      Bouyon
    </span>
  );
}
