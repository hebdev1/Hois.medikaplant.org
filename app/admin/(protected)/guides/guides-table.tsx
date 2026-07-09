'use client';

// Client table for the guides admin ("Kontni Hoïs"). Adds:
//   • per-row + select-all checkboxes with a floating bulk-delete bar
//   • cover-image thumbnails (falls back to the accent-color tile when a
//     guide has no cover_image_url) for a cleaner scan
// The row-level publish/feature/delete controls stay in GuideRowActions.

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  Eye,
  EyeOff,
  Edit3,
  Clock,
  BookOpen,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GuideRowActions from './guide-row-actions';
import { bulkDeleteGuides } from './actions';

type GuideLite = {
  id: string;
  title: string;
  slug: string;
  read_minutes: number;
  accent_color: string;
  cover_image_url: string | null;
  category_label: string | null;
  plan_required: string;
  published: boolean;
  featured: boolean;
  updated_at: string;
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};
const HT_DATE = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function GuidesTable({ guides }: { guides: GuideLite[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Drop selections that disappear after a refresh (e.g. deleted rows).
  React.useEffect(() => {
    setSelected((prev) => {
      const live = new Set(guides.map((g) => g.id));
      const next = new Set([...prev].filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [guides]);

  const allSelected = guides.length > 0 && selected.size === guides.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(guides.map((g) => g.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onBulkDelete() {
    if (!confirm) {
      setConfirm(true);
      window.setTimeout(() => setConfirm(false), 4000);
      return;
    }
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await bulkDeleteGuides([...selected]);
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      } else {
        setError(res.error);
      }
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  }

  if (guides.length === 0) {
    return (
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-12 text-center">
        <BookOpen className="w-8 h-8 text-earth-500 mx-auto mb-3" strokeWidth={1.6} />
        <p className="text-earth-700 font-semibold">
          Pa gen atik ki matche filtè a.
        </p>
        <Link
          href="/admin/guides/new"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-800"
        >
          Kreye premye atik
        </Link>
      </section>
    );
  }

  return (
    <>
      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 mb-3 flex items-center gap-3 flex-wrap bg-ink text-cream-50 rounded-2xl px-4 py-2.5 shadow-plant">
          <span className="text-sm font-semibold">
            {selected.size} atik chwazi
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 text-xs text-cream-200 hover:text-white"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.4} />
            Dechwazi tout
          </button>
          {error && (
            <span className="text-xs text-rose-300">{error}</span>
          )}
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={deleting}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition',
              confirm
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-400/40'
            )}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Trash2 className="w-4 h-4" strokeWidth={2.4} />
            )}
            {confirm
              ? `Konfime — efase ${selected.size} atik`
              : 'Efase seleksyon an'}
          </button>
        </div>
      )}

      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Chwazi tout"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-forest-700 cursor-pointer"
                  />
                </th>
                <th className="text-left px-2 py-3">Tit</th>
                <th className="text-left px-3 py-3">Kategori</th>
                <th className="text-left px-3 py-3">Plan</th>
                <th className="text-left px-3 py-3">Estati</th>
                <th className="text-left px-3 py-3">Mete ajou</th>
                <th className="text-right px-5 py-3">Aksyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {guides.map((g) => {
                const isSel = selected.has(g.id);
                return (
                  <tr
                    key={g.id}
                    className={cn(
                      'transition',
                      isSel ? 'bg-forest-50/60' : 'hover:bg-cream-50/60'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Chwazi ${g.title}`}
                        checked={isSel}
                        onChange={() => toggleOne(g.id)}
                        className="w-4 h-4 accent-forest-700 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/guides/${g.id}`}
                        className="flex items-center gap-3 group"
                      >
                        {/* Thumbnail: cover image when present, else the
                            accent-color tile so old guides still line up. */}
                        {g.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.cover_image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-cream-200"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="w-10 h-10 rounded-lg shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${g.accent_color}, ${g.accent_color}AA)`,
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate group-hover:text-forest-700 transition">
                            {g.title}
                          </div>
                          <div className="text-[11px] text-earth-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono truncate">/{g.slug}</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" strokeWidth={2.2} />
                              {g.read_minutes} min
                            </span>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-earth-700">
                      {g.category_label ?? (
                        <span className="text-earth-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${PLAN_TONE[g.plan_required]}`}
                      >
                        {PLAN_LABEL[g.plan_required]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {g.published ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                            <Eye className="w-3 h-3" strokeWidth={2.4} />
                            Pibliye
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-200 text-earth-700">
                            <EyeOff className="w-3 h-3" strokeWidth={2.4} />
                            Bouyon
                          </span>
                        )}
                        {g.featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                            <Star className="w-3 h-3 fill-current" strokeWidth={2.4} />
                            Vedèt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-earth-600">
                      {HT_DATE.format(new Date(g.updated_at))}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/guides/${g.id}`}
                          title="Modifye"
                          className="grid place-items-center w-8 h-8 rounded-lg bg-white text-earth-600 border border-cream-200 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200 transition"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={2.2} />
                        </Link>
                        <GuideRowActions
                          guideId={g.id}
                          initialPublished={g.published}
                          initialFeatured={g.featured}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
