'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PlantBig from '@/components/dashboard/plant-big';
import type { Database } from '@/types/database';
import type { AdminGuideState } from './actions';
import { uploadGuideImage } from './actions';

// Tiptap pulls ~150kb of JS; dynamic-import so it only ships on the
// admin guide editor pages and never blocks first paint elsewhere.
const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-8 text-sm text-earth-600 text-center">
        Editè rich-text ap chaje…
      </div>
    ),
  }
);

// Small converter so legacy guides (which only have body_markdown) load
// into the rich editor with their headings/lists/bold intact. Mirrors
// the regex grammar of the dashboard's render-side parser. Anything it
// doesn't recognize falls through as a <p>.
function legacyMarkdownToHtml(md: string): string {
  if (!md) return '';
  const blocks = md.split(/\n\n+/);
  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('## ')) return `<h2>${inline(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith('# ')) return `<h1>${inline(trimmed.slice(2))}</h1>`;
      const lines = trimmed.split('\n');
      if (lines.every((l) => /^\d+\.\s/.test(l))) {
        return `<ol>${lines
          .map((l) => `<li>${inline(l.replace(/^\d+\.\s/, ''))}</li>`)
          .join('')}</ol>`;
      }
      if (lines.every((l) => /^[-*]\s/.test(l))) {
        return `<ul>${lines
          .map((l) => `<li>${inline(l.replace(/^[-*]\s/, ''))}</li>`)
          .join('')}</ul>`;
      }
      return `<p>${inline(trimmed).replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

type Guide = Database['public']['Tables']['guides']['Row'];
type Category = Database['public']['Tables']['guide_categories']['Row'];
type GuideArt = Database['public']['Enums']['guide_art'];

const ART_OPTIONS: { value: GuideArt; label: string }[] = [
  { value: 'leaf', label: 'Fèy' },
  { value: 'sprout', label: 'Plantil' },
  { value: 'droplet', label: 'Gout dlo' },
  { value: 'sparkle', label: 'Klere' },
  { value: 'tree', label: 'Pyebwa' },
  { value: 'flower', label: 'Flè' },
];

const PRESET_COLORS = [
  '#65881a',
  '#3D7222',
  '#93b031',
  '#e78e17',
  '#985c0c',
  '#B73A3A',
  '#5C3D2E',
  '#3A2218',
];

type FormShape = {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  category_id: string;
  tag: string;
  accent_color: string;
  art: GuideArt;
  read_minutes: number;
  language: 'ht' | 'fr' | 'en';
  plan_required: 'basic' | 'premium' | 'vip';
  featured: boolean;
  published: boolean;
  author_name: string;
  author_role: string;
  author_avatar_url: string;
  cover_image_url: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function GuideForm({
  mode,
  guide,
  categories,
  action,
}: {
  mode: 'create' | 'edit';
  guide?: Guide;
  categories: Category[];
  action: (prev: AdminGuideState, formData: FormData) => Promise<AdminGuideState>;
}) {
  const [state, formAction] = useFormState<AdminGuideState, FormData>(action, {});

  const [values, setValues] = React.useState<FormShape>(() => ({
    title: guide?.title ?? '',
    slug: guide?.slug ?? '',
    excerpt: guide?.excerpt ?? '',
    // Prefer existing HTML; if the guide only has legacy markdown, convert
    // once on initial mount so the rich editor opens with the same content.
    body_html:
      guide?.body_html ||
      (guide?.body_markdown ? legacyMarkdownToHtml(guide.body_markdown) : ''),
    category_id: guide?.category_id ?? '',
    tag: guide?.tag ?? '',
    accent_color: guide?.accent_color ?? '#65881a',
    art: (guide?.art as GuideArt) ?? 'leaf',
    read_minutes: guide?.read_minutes ?? 5,
    language: ((guide?.language as 'ht' | 'fr' | 'en') ?? 'ht'),
    plan_required: ((guide?.plan_required as 'basic' | 'premium' | 'vip') ?? 'basic'),
    featured: guide?.featured ?? false,
    published: guide?.published ?? false,
    author_name: guide?.author_name ?? 'Hoïs Inivèsite',
    author_role: guide?.author_role ?? '',
    author_avatar_url: guide?.author_avatar_url ?? '',
    cover_image_url: guide?.cover_image_url ?? '',
  }));

  // Auto-fill slug from title when creating, until the user types in slug manually
  const [slugTouched, setSlugTouched] = React.useState(mode === 'edit');
  React.useEffect(() => {
    if (slugTouched) return;
    setValues((v) => ({ ...v, slug: slugify(v.title) }));
  }, [values.title, slugTouched]);

  function set<K extends keyof FormShape>(key: K, val: FormShape[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* LEFT — content */}
      <div className="space-y-5">
        <Section title="Kontni">
          <Field label="Tit" required>
            <input
              type="text"
              name="title"
              required
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
              placeholder="10 abitid pou ekilibre sik la"
            />
          </Field>
          <Field
            label="Slug (URL)"
            help="A-z, 0-9, ak tire sèlman. Otomatik soti nan tit la."
          >
            <input
              type="text"
              name="slug"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', slugify(e.target.value));
              }}
              className={cn(inputClass, 'font-mono')}
              placeholder="abitid-pou-sik"
            />
          </Field>
          <Field label="Ekstrè" required help="2-3 fraz ki rezime atik la.">
            <textarea
              name="excerpt"
              required
              rows={3}
              value={values.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              className={cn(inputClass, 'resize-y')}
              placeholder="Yon ti rezime ki konvenk lektè a pou kontinye…"
            />
          </Field>
          <Field
            label="Kontni"
            required
            help="Sèvi ak baton zouti yo anwo a pou fòmate tèks la: tit, gra, italik, lis, aliyman, lyen, imaj. Tankou nan Word/Google Docs."
          >
            <RichTextEditor
              value={values.body_html}
              onChange={(html) => set('body_html', html)}
              placeholder="Kòmanse ekri atik la la a…"
              minHeight={420}
              uploadImage={uploadGuideImage}
            />
            {/* The form posts body_html via this hidden mirror — Tiptap
                lives outside the form's native field surface. */}
            <input type="hidden" name="body_html" value={values.body_html} />
          </Field>
        </Section>

        <Section title="Otè">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Non otè a">
              <input
                type="text"
                name="author_name"
                value={values.author_name}
                onChange={(e) => set('author_name', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Wòl">
              <input
                type="text"
                name="author_role"
                value={values.author_role}
                onChange={(e) => set('author_role', e.target.value)}
                className={inputClass}
                placeholder="Ton vye"
              />
            </Field>
          </div>
          <Field label="URL foto otè (opsyonèl)">
            <input
              type="url"
              name="author_avatar_url"
              value={values.author_avatar_url}
              onChange={(e) => set('author_avatar_url', e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>
        </Section>
      </div>

      {/* RIGHT — settings sidebar */}
      <aside className="space-y-5">
        <Section title="Piblikasyon">
          <Toggle
            name="published"
            label="Pibliye"
            description="Lè li aktif, atik la parèt pou tout itilizatè ki gen plan ki kòrèk."
            checked={values.published}
            onChange={(v) => set('published', v)}
            icon={values.published ? Eye : EyeOff}
            tone={values.published ? 'forest' : 'cream'}
          />
          <Toggle
            name="featured"
            label="Vedèt"
            description="Yon sèl atik vedèt nan menm tan — parèt nan ewo a."
            checked={values.featured}
            onChange={(v) => set('featured', v)}
            tone="gold"
          />
        </Section>

        <Section title="Klasifikasyon">
          <Field label="Kategori">
            <select
              name="category_id"
              value={values.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className={inputClass}
            >
              <option value="">— Pa gen kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Etikèt (tag)">
            <input
              type="text"
              name="tag"
              value={values.tag}
              onChange={(e) => set('tag', e.target.value)}
              className={inputClass}
              placeholder="Egz: Plant, Konsèy, Pwotokòl…"
            />
          </Field>
          <Field label="Lang">
            <Segment
              name="language"
              value={values.language}
              onChange={(v) => set('language', v as FormShape['language'])}
              options={[
                { value: 'ht', label: 'Kreyòl' },
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English' },
              ]}
            />
          </Field>
          <Field label="Plan ki obligatwa">
            <Segment
              name="plan_required"
              value={values.plan_required}
              onChange={(v) => set('plan_required', v as FormShape['plan_required'])}
              options={[
                { value: 'basic', label: 'Bazilik' },
                { value: 'premium', label: 'Sitwonèl' },
                { value: 'vip', label: 'Melis' },
              ]}
            />
          </Field>
          <Field label="Tan lekti (min)">
            <input
              type="number"
              name="read_minutes"
              min={1}
              max={120}
              value={values.read_minutes}
              onChange={(e) => set('read_minutes', Math.max(1, Number(e.target.value) || 1))}
              className={cn(inputClass, 'w-24')}
            />
          </Field>
        </Section>

        <Section title="Aparans">
          <Field label="Glif (atistik)">
            <div className="grid grid-cols-3 gap-2">
              {ART_OPTIONS.map((opt) => {
                const active = values.art === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('art', opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-xl border transition',
                      active
                        ? 'bg-forest-50 border-forest-300 ring-2 ring-forest-200'
                        : 'bg-white border-cream-200 hover:border-forest-200'
                    )}
                    aria-pressed={active}
                  >
                    <div
                      className="w-full aspect-square rounded-lg grid place-items-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${values.accent_color}, ${values.accent_color}AA)`,
                      }}
                    >
                      <PlantBig art={opt.value} accent="#FFFDF8" opacity={0.85} size={48} />
                    </div>
                    <span className="text-[10px] font-semibold text-earth-700">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="art" value={values.art} />
          </Field>

          <Field label="Koulè aksan">
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('accent_color', c)}
                  aria-label={c}
                  className={cn(
                    'w-7 h-7 rounded-lg border-2 transition',
                    values.accent_color === c
                      ? 'border-ink ring-2 ring-cream-200'
                      : 'border-white hover:border-cream-300'
                  )}
                  style={{ background: c }}
                />
              ))}
              <input
                type="text"
                value={values.accent_color}
                onChange={(e) => set('accent_color', e.target.value)}
                className={cn(inputClass, 'font-mono w-24 text-xs')}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <input type="hidden" name="accent_color" value={values.accent_color} />
          </Field>

          <Field label="Foto kouvèti / thumbnail (opsyonèl)">
            <CoverImageField
              value={values.cover_image_url}
              onChange={(url) => set('cover_image_url', url)}
            />
            <input
              type="hidden"
              name="cover_image_url"
              value={values.cover_image_url}
            />
          </Field>
        </Section>

        <SubmitBar mode={mode} state={state} />
      </aside>
    </form>
  );
}

// ─── Cover image field: upload OR paste URL, with live preview ─────────────
function CoverImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadGuideImage(fd);
      if (res.ok) onChange(res.url);
      else setErr(res.error);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Preview / placeholder */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-cream-200 bg-cream-50 shrink-0 grid place-items-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <PlantBig art="leaf" accent="#c5cf5e" opacity={0.6} size={34} />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
              ) : (
                <Save className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
              Telechaje imaj
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Retire
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          {/* Manual URL fallback */}
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClass, 'text-xs')}
            placeholder="…oswa kole yon URL imaj"
          />
        </div>
      </div>
      {err && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {err}
        </p>
      )}
    </div>
  );
}

// ─── Small primitives (scoped to this file) ─────────────────────────────────

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-4">
      <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {help && <p className="text-[11px] text-earth-500 mt-1 leading-snug">{help}</p>}
    </label>
  );
}

function Segment({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200 w-full">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              active
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-earth-600 hover:text-ink'
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function Toggle({
  name,
  label,
  description,
  checked,
  onChange,
  tone = 'forest',
  icon: Icon,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: 'forest' | 'gold' | 'cream';
  icon?: LucideIcon;
}) {
  const activeClass =
    tone === 'gold'
      ? 'bg-gold-500'
      : tone === 'cream'
      ? 'bg-earth-500'
      : 'bg-forest-600';
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
          {label}
        </div>
        {description && (
          <div className="text-[11px] text-earth-600 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked ? activeClass : 'bg-cream-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
      {checked && <input type="hidden" name={name} value="on" />}
    </div>
  );
}

function SubmitBar({ mode, state }: { mode: 'create' | 'edit'; state: AdminGuideState }) {
  const { pending } = useFormStatus();
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-3">
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold px-5 py-3 rounded-xl transition"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Save className="w-4 h-4" strokeWidth={2.4} />
        )}
        {mode === 'create' ? 'Kreye atik la' : 'Anrejistre chanjman yo'}
      </button>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>Chanjman yo anrejistre.</span>
        </div>
      )}

      <Link
        href="/admin/guides"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-700 hover:text-ink"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        Tounen nan lis la
      </Link>
    </section>
  );
}
