'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ExternalLink, Search } from 'lucide-react';
import { type Block } from '@/components/cms/page-blocks';
import { BlockEditor } from '@/components/cms/block-editor';
import { RevisionsPanel } from '@/components/cms/revisions-panel';
import { updateArticle, setArticleStatus } from '../actions';
import { type LakouTabOption } from '../../lakou/actions';

type ArticleData = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  excerpt: string;
  cover_image: string;
  category: string;
  tags: string[];
  blocks: Block[];
  seo_title: string;
  seo_description: string;
  lakou_tab_id: string;
};

export default function ArticleEditor({
  article,
  lakouTabs,
}: {
  article: ArticleData;
  lakouTabs: LakouTabOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(article.title);
  const [slug, setSlug] = React.useState(article.slug);
  const [excerpt, setExcerpt] = React.useState(article.excerpt);
  const [cover, setCover] = React.useState(article.cover_image);
  const [category, setCategory] = React.useState(article.category);
  const [tags, setTags] = React.useState(article.tags.join(', '));
  const [blocks, setBlocks] = React.useState<Block[]>(article.blocks);
  const [seoTitle, setSeoTitle] = React.useState(article.seo_title);
  const [seoDesc, setSeoDesc] = React.useState(article.seo_description);
  const [lakouTabId, setLakouTabId] = React.useState(article.lakou_tab_id ?? '');
  const [status, setStatus] = React.useState(article.status);
  const [saving, setSaving] = React.useState(false);
  const [pub, setPub] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  function tagsArray() {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setMsg(null);
    const res = await updateArticle(article.id, {
      title,
      slug,
      excerpt,
      cover_image: cover,
      category,
      tags: tagsArray(),
      blocks,
      seo_title: seoTitle,
      seo_description: seoDesc,
      lakou_tab_id: lakouTabId || null,
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
    const res = await setArticleStatus(article.id, next);
    setPub(false);
    if (res.ok) {
      setStatus(next);
      setMsg({ tone: 'ok', text: next === 'published' ? 'Atik pibliye ✓' : 'Retire nan piblik.' });
      router.refresh();
    } else {
      setMsg({ tone: 'err', text: res.error ?? 'Echwe.' });
    }
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-ink">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Atik yo
        </Link>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            status === 'published' ? 'bg-forest-100 text-forest-700' : 'bg-cream-200 text-earth-600'
          }`}
        >
          {status === 'published' ? 'Pibliye' : 'Bouyon'}
        </span>
        <div className="flex-1" />
        {status === 'published' && (
          <a href={`/atik/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-forest-700 px-3 py-2">
            Wè atik <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
          </a>
        )}
        <RevisionsPanel contentType="article" contentId={article.id} />
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
            msg.tone === 'ok' ? 'bg-forest-50 border-forest-200 text-forest-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="space-y-5">
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tit</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} text-lg font-semibold`} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Adrès (slug)</span>
            <div className="mt-1 flex items-center rounded-lg border border-cream-200 overflow-hidden focus-within:ring-2 focus-within:ring-forest-200">
              <span className="pl-3 pr-1 text-sm text-earth-400 font-mono select-none">/atik/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 py-2 pr-3 text-sm text-ink font-mono focus:outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Rezime (excerpt)</span>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Yon fraz kout ki dekri atik la…" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Kategori</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="Egz. Nitrisyon" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tags (vigil separe)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="plant, detoks, fèy" />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Imaj kouvèti (URL)</span>
            <input value={cover} onChange={(e) => setCover(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="Kopye nan Bibliyotèk Medya" />
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="mt-2 w-full max-h-40 object-cover rounded-lg border border-cream-200" />
            )}
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tab Lakou Limyè</span>
            <select
              value={lakouTabId}
              onChange={(e) => setLakouTabId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Pa nan Lakou Limyè —</option>
              {lakouTabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500 mb-2">Kò atik la (blòk)</div>
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>

        <details className="bg-white border border-cream-200 rounded-2xl shadow-card p-5">
          <summary className="cursor-pointer text-sm font-bold text-ink flex items-center gap-2 list-none">
            <Search className="w-4 h-4 text-earth-500" strokeWidth={2.2} />
            SEO (opsyonèl)
          </summary>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tit SEO</span>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Meta deskripsyon</span>
              <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </label>
          </div>
        </details>
      </div>
    </div>
  );
}
