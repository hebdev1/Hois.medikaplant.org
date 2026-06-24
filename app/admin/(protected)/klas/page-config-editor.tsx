'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { savePageConfig, type PageConfigState } from './actions';

type Initial = {
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_href: string | null;
  hero_image_url: string | null;
  stat_courses_label: string | null;
  stat_categories_label: string | null;
  stat_rating_label: string | null;
  stat_rating_value: number | null;
  benefits: string[];
  faqs: unknown;
  formats: unknown;
  cta_title: string | null;
  cta_subtitle: string | null;
} | null;

export default function PageConfigEditor({ initial }: { initial: Initial }) {
  const [state, formAction] = useFormState<PageConfigState, FormData>(
    savePageConfig,
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Ewo (anlè paj la)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Eyebrow (ti tag)">
            <input
              name="hero_eyebrow"
              defaultValue={initial?.hero_eyebrow ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Bouton CTA (etikèt)">
            <input
              name="hero_cta_label"
              defaultValue={initial?.hero_cta_label ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Tit prensipal">
          <textarea
            name="hero_title"
            rows={2}
            defaultValue={initial?.hero_title ?? ''}
            className={cn(inputClass, 'resize-y')}
          />
        </Field>
        <Field label="Soutit (paragraf desann tit la)">
          <textarea
            name="hero_subtitle"
            rows={3}
            defaultValue={initial?.hero_subtitle ?? ''}
            className={cn(inputClass, 'resize-y')}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="CTA lyen">
            <input
              name="hero_cta_href"
              defaultValue={initial?.hero_cta_href ?? ''}
              className={cn(inputClass, 'font-mono text-xs')}
              placeholder="/#pri oswa https://…"
            />
          </Field>
          <Field label="Imaj ewo (URL)">
            <input
              name="hero_image_url"
              type="url"
              defaultValue={initial?.hero_image_url ?? ''}
              className={cn(inputClass, 'font-mono text-xs')}
            />
          </Field>
        </div>
      </Section>

      <Section title="Estatistik anba ewo a">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Etikèt # klas">
            <input
              name="stat_courses_label"
              defaultValue={initial?.stat_courses_label ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Etikèt # kategori">
            <input
              name="stat_categories_label"
              defaultValue={initial?.stat_categories_label ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Etikèt nòt">
            <input
              name="stat_rating_label"
              defaultValue={initial?.stat_rating_label ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Nòt afiche (0-5)">
          <input
            name="stat_rating_value"
            type="number"
            min={0}
            max={5}
            step={0.1}
            defaultValue={initial?.stat_rating_value ?? 4.9}
            className={cn(inputClass, 'w-32')}
          />
        </Field>
      </Section>

      <Section title="Benefis (chak liy = yon antre, maks 12)">
        <Field label="Lis benefis yo">
          <textarea
            name="benefits"
            rows={8}
            defaultValue={(initial?.benefits ?? []).join('\n')}
            className={cn(inputClass, 'resize-y font-mono text-xs')}
            placeholder="Aksè iliminmite a tout klas…"
          />
        </Field>
      </Section>

      <Section title="Fòma aprantisaj (JSON)">
        <Field label='Egzanp: [{"title":"…","body":"…","icon":"video"}]'>
          <textarea
            name="formats"
            rows={8}
            defaultValue={JSON.stringify(initial?.formats ?? [], null, 2)}
            className={cn(inputClass, 'resize-y font-mono text-[11px]')}
          />
        </Field>
      </Section>

      <Section title="FAQ (JSON)">
        <Field label='Egzanp: [{"q":"…","a":"…"}]'>
          <textarea
            name="faqs"
            rows={10}
            defaultValue={JSON.stringify(initial?.faqs ?? [], null, 2)}
            className={cn(inputClass, 'resize-y font-mono text-[11px]')}
          />
        </Field>
      </Section>

      <Section title="Apèl-aksyon nan fen paj la (CTA)">
        <Field label="Tit CTA">
          <input
            name="cta_title"
            defaultValue={initial?.cta_title ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Soutit CTA">
          <textarea
            name="cta_subtitle"
            rows={3}
            defaultValue={initial?.cta_subtitle ?? ''}
            className={cn(inputClass, 'resize-y')}
          />
        </Field>
      </Section>

      <SubmitBar state={state} />
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 space-y-3 shadow-card">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-earth-600">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SubmitBar({ state }: { state: PageConfigState }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-4 z-10 bg-white/90 backdrop-blur border border-cream-200 rounded-2xl p-3 shadow-card flex items-center gap-3 flex-wrap">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
        ) : (
          <Save className="w-4 h-4" strokeWidth={2.2} />
        )}
        Anrejistre konfigirasyon paj la
      </button>
      {state.error && (
        <span className="text-sm text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} /> {state.error}
        </span>
      )}
      {state.ok && (
        <span className="text-sm text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} /> Chanjman aplike.
        </span>
      )}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';
