'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveCourse, type CourseState } from './actions';
import { uploadGuideImage } from '../guides/actions';

// Reuse the Tiptap editor we built for /admin/guides — it's already
// dynamic-imported so it ships on this admin page only.
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

type CategoryOpt = { id: string; title: string };

type Initial = {
  id: string;
  title: string;
  slug: string;
  description: string;
  body_html: string | null;
  cover_image_url: string | null;
  instructor_name: string;
  instructor_role: string | null;
  instructor_avatar_url: string | null;
  duration_text: string | null;
  level: string;
  format: string;
  zoom_url: string | null;
  zoom_schedule: { text?: string } | null;
  student_count_text: string | null;
  rating: number;
  price_cents: number | null;
  seat_capacity: number | null;
  plan_required: string;
  category_id: string | null;
  language: string;
  featured: boolean;
  active: boolean;
  display_order: number;
  tags: string[];
};

type Props = {
  mode: 'create' | 'edit';
  initial?: Initial;
  categories: CategoryOpt[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function CourseForm({ mode, initial, categories }: Props) {
  const id = mode === 'edit' && initial ? initial.id : null;
  const action = saveCourse.bind(null, id);
  const [state, formAction] = useFormState<CourseState, FormData>(action, {});

  const [v, setV] = React.useState({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    body_html: initial?.body_html ?? '',
    cover_image_url: initial?.cover_image_url ?? '',
    instructor_name: initial?.instructor_name ?? 'Hoïs Inivèsite',
    instructor_role: initial?.instructor_role ?? '',
    instructor_avatar_url: initial?.instructor_avatar_url ?? '',
    duration_text: initial?.duration_text ?? '',
    level: initial?.level ?? 'tout_nivo',
    format: initial?.format ?? 'video',
    zoom_url: initial?.zoom_url ?? '',
    zoom_schedule_text: initial?.zoom_schedule?.text ?? '',
    student_count_text: initial?.student_count_text ?? '',
    rating: initial?.rating ?? 5.0,
    price_cents: initial?.price_cents ?? null,
    seat_capacity: initial?.seat_capacity ?? null,
    plan_required: initial?.plan_required ?? 'basic',
    category_id: initial?.category_id ?? '',
    language: initial?.language ?? 'ht',
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
    display_order: initial?.display_order ?? 0,
    tags: (initial?.tags ?? []).join(', '),
  });

  const [slugTouched, setSlugTouched] = React.useState(mode === 'edit');
  React.useEffect(() => {
    if (slugTouched) return;
    setV((p) => ({ ...p, slug: slugify(p.title) }));
  }, [v.title, slugTouched]);

  function set<K extends keyof typeof v>(k: K, val: (typeof v)[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  const liveZoom = v.format !== 'video';

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_340px] gap-6">
      {/* ── LEFT ──────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <Section title="Kontni">
          <Field label="Tit klas la" required>
            <input
              name="title"
              value={v.title}
              onChange={(e) => set('title', e.target.value)}
              required
              className={inputClass}
              placeholder="Idantifye 12 plant santiniye Ayisyen"
            />
          </Field>
          <Field label="Slug (URL)" help="A-z, 0-9, ak tire sèlman.">
            <input
              name="slug"
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', slugify(e.target.value));
              }}
              className={cn(inputClass, 'font-mono')}
              placeholder="idantifye-plant-santiniye"
            />
          </Field>
          <Field label="Deskripsyon kout (kat preview)" required>
            <textarea
              name="description"
              required
              rows={3}
              value={v.description}
              onChange={(e) => set('description', e.target.value)}
              className={cn(inputClass, 'resize-y')}
              placeholder="2-3 fraz ki rezime klas la pou kat afichaj la."
            />
          </Field>
          <Field
            label="Kontni konplè"
            help="Itilize zouti yo pou fòmate kontni a — tankou nan Word."
          >
            <RichTextEditor
              value={v.body_html}
              onChange={(html) => set('body_html', html)}
              minHeight={300}
              uploadImage={uploadGuideImage}
              placeholder="Plan modil yo, sa moun nan ap aprann, prerequis…"
            />
            <input type="hidden" name="body_html" value={v.body_html} />
          </Field>
        </Section>

        <Section title="Fòma livrezon">
          <Field label="Fòma">
            <Segment
              name="format"
              value={v.format}
              onChange={(val) => set('format', val)}
              options={[
                { value: 'video', label: 'Videyo (sou demand)' },
                { value: 'live_zoom', label: 'Zoom direkt' },
                { value: 'hybrid', label: 'Hybrid (videyo + Zoom)' },
              ]}
            />
          </Field>
          {liveZoom && (
            <>
              <Field
                label="Lyen Zoom (https://…)"
                help="Lyen sesyon Zoom rekiren oswa salle imedyat."
              >
                <input
                  name="zoom_url"
                  type="url"
                  value={v.zoom_url}
                  onChange={(e) => set('zoom_url', e.target.value)}
                  className={cn(inputClass, 'font-mono text-xs')}
                  placeholder="https://us02web.zoom.us/j/123456789"
                />
              </Field>
              <Field
                label="Pwogram sesyon yo"
                help="Egz: Chak Madi ak Jedi 7pm Ayiti · 90 min"
              >
                <input
                  name="zoom_schedule_text"
                  value={v.zoom_schedule_text}
                  onChange={(e) => set('zoom_schedule_text', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}
        </Section>

        <Section title="Otè / Enstriktè">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Non enstriktè">
              <input
                name="instructor_name"
                value={v.instructor_name}
                onChange={(e) => set('instructor_name', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Wòl / titrè">
              <input
                name="instructor_role"
                value={v.instructor_role}
                onChange={(e) => set('instructor_role', e.target.value)}
                className={inputClass}
                placeholder="Èrboris santiniye"
              />
            </Field>
          </div>
          <Field label="Foto enstriktè (URL)">
            <input
              name="instructor_avatar_url"
              type="url"
              value={v.instructor_avatar_url}
              onChange={(e) => set('instructor_avatar_url', e.target.value)}
              className={cn(inputClass, 'font-mono text-xs')}
            />
          </Field>
        </Section>
      </div>

      {/* ── RIGHT (settings) ──────────────────────────────────────────────── */}
      <aside className="space-y-5">
        <Section title="Vizibilite">
          <Toggle
            name="active"
            label="Pibliye"
            description="Klas la parèt sou /klas la."
            checked={v.active}
            onChange={(b) => set('active', b)}
            Icon={v.active ? Eye : EyeOff}
            tone="forest"
          />
          <Toggle
            name="featured"
            label="Vedèt"
            description="Parèt nan seksyon 'Klas vedèt' yo."
            checked={v.featured}
            onChange={(b) => set('featured', b)}
            Icon={Star}
            tone="gold"
          />
        </Section>

        <Section title="Klasifikasyon">
          <Field label="Kategori">
            <select
              name="category_id"
              value={v.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className={inputClass}
            >
              <option value="">— Pa gen kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nivo">
            <Segment
              name="level"
              value={v.level}
              onChange={(val) => set('level', val)}
              options={[
                { value: 'debutan', label: 'Debutan' },
                { value: 'entermedye', label: 'Entèmedyè' },
                { value: 'avanse', label: 'Avanse' },
                { value: 'tout_nivo', label: 'Tout nivo' },
              ]}
            />
          </Field>
          <Field label="Plan ki obligatwa">
            <Segment
              name="plan_required"
              value={v.plan_required}
              onChange={(val) => set('plan_required', val)}
              options={[
                { value: 'basic', label: 'Bazilik' },
                { value: 'premium', label: 'Sitwonèl' },
                { value: 'vip', label: 'Melis' },
              ]}
            />
          </Field>
          <Field label="Lang">
            <Segment
              name="language"
              value={v.language}
              onChange={(val) => set('language', val)}
              options={[
                { value: 'ht', label: 'Kreyòl' },
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English' },
              ]}
            />
          </Field>
          <Field label="Etikèt (tags, separe ak vigil)">
            <input
              name="tags"
              value={v.tags}
              onChange={(e) => set('tags', e.target.value)}
              className={inputClass}
              placeholder="Plant, Idantifikasyon"
            />
          </Field>
        </Section>

        <Section title="Pri & metadata">
          <Field
            label="Pri (USD cents)"
            help="Kite vid si li enkli nan abònman. Egz: 4900 = $49.00"
          >
            <input
              name="price_cents"
              type="number"
              min={0}
              value={v.price_cents ?? ''}
              onChange={(e) =>
                set(
                  'price_cents',
                  e.target.value === '' ? null : Math.max(0, Number(e.target.value))
                )
              }
              className={inputClass}
              placeholder="(vid = enkli)"
            />
          </Field>
          <Field
            label="Kapasite (# plas)"
            help="Kite vid pou san limit. Lè kapasite a rive, lòt moun pap ka enskri."
          >
            <input
              name="seat_capacity"
              type="number"
              min={1}
              value={v.seat_capacity ?? ''}
              onChange={(e) =>
                set(
                  'seat_capacity',
                  e.target.value === '' ? null : Math.max(1, Number(e.target.value))
                )
              }
              className={inputClass}
              placeholder="(vid = san limit)"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dirasyon (tèks)" help="Egz: 6 èdtan · 4 modil">
              <input
                name="duration_text"
                value={v.duration_text}
                onChange={(e) => set('duration_text', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="# elèv afiche" help="Egz: 2,400+">
              <input
                name="student_count_text"
                value={v.student_count_text}
                onChange={(e) => set('student_count_text', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nòt (0-5)">
              <input
                name="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={v.rating}
                onChange={(e) =>
                  set('rating', Math.max(0, Math.min(5, Number(e.target.value) || 0)))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Lòd afichaj">
              <input
                name="display_order"
                type="number"
                min={0}
                value={v.display_order}
                onChange={(e) =>
                  set('display_order', Math.max(0, Number(e.target.value) || 0))
                }
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Aparans kat">
          <Field label="URL imaj kouvèti">
            <input
              name="cover_image_url"
              type="url"
              value={v.cover_image_url}
              onChange={(e) => set('cover_image_url', e.target.value)}
              className={cn(inputClass, 'font-mono text-xs')}
            />
          </Field>
          {v.cover_image_url && (
            <div className="rounded-xl overflow-hidden border border-cream-200 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Section>

        <SubmitBar mode={mode} state={state} />
      </aside>
    </form>
  );
}

// ─── Primitives (scoped) ────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-3">
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
    <div className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200 w-full flex-wrap">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all',
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
  Icon,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  tone?: 'forest' | 'gold';
  Icon?: LucideIcon;
}) {
  const activeClass = tone === 'gold' ? 'bg-gold-500' : 'bg-forest-600';
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

function SubmitBar({ mode, state }: { mode: 'create' | 'edit'; state: CourseState }) {
  const { pending } = useFormStatus();
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card space-y-3 sticky top-4">
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
        {mode === 'create' ? 'Kreye klas la' : 'Anrejistre chanjman yo'}
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
        href="/admin/klas"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-700 hover:text-ink"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
        Tounen nan lis klas yo
      </Link>
    </section>
  );
}
