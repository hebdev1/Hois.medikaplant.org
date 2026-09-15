'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ExternalLink, Search } from 'lucide-react';
import { PageBlocks, type Block } from '@/components/cms/page-blocks';
import { BlockEditor } from '@/components/cms/block-editor';
import { RevisionsPanel } from '@/components/cms/revisions-panel';
import { updatePage, setPageStatus } from '../actions';

type PageData = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  blocks: Block[];
  seo_title: string;
  seo_description: string;
  og_image: string;
};

export default function PageEditor({ page }: { page: PageData }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(page.title);
  const [slug, setSlug] = React.useState(page.slug);
  const [blocks, setBlocks] = React.useState<Block[]>(page.blocks);
  const [seoTitle, setSeoTitle] = React.useState(page.seo_title);
  const [seoDesc, setSeoDesc] = React.useState(page.seo_description);
  const [ogImage, setOgImage] = React.useState(page.og_image);
  const [status, setStatus] = React.useState(page.status);
  const [saving, setSaving] = React.useState(false);
  const [pub, setPub] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function save(): Promise<boolean> {
    setSaving(true);
    setMsg(null);
    const res = await updatePage(page.id, {
      title,
      slug,
      blocks,
      seo_title: seoTitle,
      seo_description: seoDesc,
      og_image: ogImage,
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ tone: 'ok', text: 'Anrejistre.' });
      router.refresh();
      return true;
    }
    setMsg({ tone: 'err', text: res.error ?? 'Echwe.' });
    return false;
  }

  async function togglePublish() {
    const ok = await save();
    if (!ok) return;
    setPub(true);
    const next = status === 'published' ? 'draft' : 'published';
    const res = await setPageStatus(page.id, next);
    setPub(false);
    if (res.ok) {
      setStatus(next);
      setMsg({ tone: 'ok', text: next === 'published' ? 'Paj pibliye ✓' : 'Retire nan piblik.' });
      router.refresh();
    } else {
      setMsg({ tone: 'err', text: res.error ?? 'Echwe.' });
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Paj yo
        </Link>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            status === 'published'
              ? 'bg-forest-100 text-forest-700'
              : 'bg-cream-200 text-earth-600'
          }`}
        >
          {status === 'published' ? 'Pibliye' : 'Bouyon'}
        </span>
        <div className="flex-1" />
        {status === 'published' && (
          <a
            href={`/paj/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-forest-700 px-3 py-2"
          >
            Wè paj <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
          </a>
        )}
        <RevisionsPanel contentType="page" contentId={page.id} />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cream-300 bg-white text-ink text-sm font-bold hover:border-forest-300 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2.2} />}
          Anrejistre
        </button>
        <button
          type="button"
          onClick={togglePublish}
          disabled={pub || saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {pub && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'published' ? 'Retire' : 'Pibliye'}
        </button>
      </header>

      {msg && (
        <div
          className={`mb-4 text-sm rounded-xl px-3.5 py-2.5 border ${
            msg.tone === 'ok'
              ? 'bg-forest-50 border-forest-200 text-forest-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_460px] gap-6 items-start">
        <div className="space-y-5">
          <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tit paj la</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Adrès (slug)</span>
              <div className="mt-1 flex items-center rounded-lg border border-cream-200 overflow-hidden focus-within:ring-2 focus-within:ring-forest-200">
                <span className="pl-3 pr-1 text-sm text-earth-400 font-mono select-none">/paj/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 py-2 pr-3 text-sm text-ink font-mono focus:outline-none"
                />
              </div>
            </label>
          </section>

          <BlockEditor blocks={blocks} onChange={setBlocks} />

          <details className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 group">
            <summary className="cursor-pointer text-sm font-bold text-ink flex items-center gap-2 list-none">
              <Search className="w-4 h-4 text-earth-500" strokeWidth={2.2} />
              SEO (opsyonèl)
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tit SEO</span>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Meta deskripsyon</span>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Imaj sosyal (URL)</span>
                <input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest-200"
                />
              </label>
            </div>
          </details>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500 mb-2">
            Apèsi ann dirèk
          </div>
          <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-2 border-b border-cream-100 bg-cream-50 text-[11px] text-earth-500 font-mono truncate">
              hoismedikaplant.com/paj/{slug}
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <h1 className="font-display text-3xl font-bold text-ink tracking-tight mb-5">
                {title}
              </h1>
              {blocks.length === 0 ? (
                <p className="text-sm text-earth-400 italic">Ajoute blòk pou wè yo la…</p>
              ) : (
                <PageBlocks blocks={blocks} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
