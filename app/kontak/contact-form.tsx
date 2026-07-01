'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Headphones,
  Stethoscope,
  Handshake,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitContactMessage, type ContactState } from './actions';

type TopicOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
  body: string;
};

// Topic list is defined here (in the client module) rather than passed
// from the server page — passing the LucideIcon component references
// across the server→client boundary fails with:
//   "Functions cannot be passed directly to Client Components"
const TOPICS: TopicOption[] = [
  {
    value: 'general',
    label: 'Yon kesyon jeneral',
    Icon: HelpCircle,
    body: 'Pou sa ki pa rantre nan lòt katègori yo.',
  },
  {
    value: 'support',
    label: 'Sipò manm',
    Icon: Headphones,
    body: 'Pwoblèm ak kont, plan, oswa platfòm la.',
  },
  {
    value: 'plant',
    label: 'Konsèy plant',
    Icon: Stethoscope,
    body: 'Yon kesyon sou yon plant oswa yon tretman.',
  },
  {
    value: 'partnership',
    label: 'Patenarya',
    Icon: Handshake,
    body: 'Klinik, doktè, èrboris ki vle kolabore.',
  },
  {
    value: 'press',
    label: 'Laprès',
    Icon: Newspaper,
    body: 'Demann entèvyou, mediya, kominikasyon.',
  },
];

const INITIAL: ContactState = { status: 'idle' };

export default function ContactForm() {
  const [state, action] = useFormState(submitContactMessage, INITIAL);
  const [topic, setTopic] = React.useState(TOPICS[0].value);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  // Reset the textareas on success — the action returns ok but Next.js
  // doesn't reset uncontrolled inputs automatically.
  React.useEffect(() => {
    if (state.status === 'ok' && formRef.current) {
      formRef.current.reset();
      setTopic(TOPICS[0].value);
    }
  }, [state]);

  if (state.status === 'ok') {
    return (
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-200 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-gradient text-white shrink-0">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold text-ink">
              Nou resevwa mesaj la, yon manm nan ekip la ap kontakte w nan mwens ke 24è tan.
            </h3>
            <p className="mt-1 text-ink-muted leading-relaxed">
              Mèsi paske w kontakte nou. Yon manm ekip la ap reponn nan mwens ke
              24 èdtan. Verifye bwat imèl ou  n ap reponn nan adrès
              ou bay la.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Voye yon lòt mesaj
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="mt-8 space-y-5">
      {/* Topic picker */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2.5">
          Tanpri dekri pwoblèm ou an ak tout detay ki enpòtan. 
          Plis deskripsyon w bay klè ak presi, se pi vit epi pi byen n ap kapab konprann sitiyasyon an pou ede w.

        </legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TOPICS.map(({ value, label, Icon, body }) => {
            const active = value === topic;
            return (
              <label
                key={value}
                className={cn(
                  'cursor-pointer rounded-xl border p-3 transition flex items-start gap-2.5',
                  active
                    ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white hover:border-brand-300'
                )}
              >
                <input
                  type="radio"
                  name="topic"
                  value={value}
                  checked={active}
                  onChange={() => setTopic(value)}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    'w-4 h-4 mt-0.5 shrink-0',
                    active ? 'text-brand-700' : 'text-ink-muted'
                  )}
                  strokeWidth={2.2}
                />
                <div className="min-w-0">
                  <div className={cn('text-sm font-semibold', active ? 'text-brand-800' : 'text-ink')}>
                    {label}
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    {body}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Identity row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Non konplè" required>
          <input
            type="text"
            name="full_name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Marie Joseph"
            className={inputClass}
          />
        </Field>
        <Field label="Imèl" required>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="ou@imel.com"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Phone + subject */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Telefòn (opsyonèl)">
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+509 …"
            className={inputClass}
          />
        </Field>
        <Field label="Sijè" required>
          <input
            type="text"
            name="subject"
            required
            minLength={3}
            maxLength={200}
            placeholder="Yon ti rezime"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Message */}
      <Field label="Mesaj" required help="**Plis ou bay detay sou bezwen w oswa kestyon w, se plis n ap kapab konprann sitiyasyon an epi reponn ou pi vit ak plis presizyon.**
">
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Ekri mesaj ou a la…"
          className={cn(inputClass, 'resize-y leading-relaxed')}
        />
      </Field>

      {/* Honeypot — visually hidden, real bots auto-fill */}
      <div aria-hidden className="hidden">
        <label>
          Konpayi
          <input
            type="text"
            name="company_name"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {state.status === 'error' && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-ink-muted max-w-md">
          Lè ou voye yon email pou nou, ou aksepte ke nou itilize done sa pou reponn ou 
          verifye paj <a href="/konfidansyalite" className="text-brand-700 hover:underline font-medium">paj konfidansyalite pou plis enfo</a>.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

const inputClass =
  'w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition placeholder:text-slate-400 text-ink';

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
      <span className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5 block">
        {label}
        {required && <span className="text-rose-600 ml-0.5 normal-case">*</span>}
      </span>
      {children}
      {help && <p className="text-[11px] text-ink-muted mt-1">{help}</p>}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-70 disabled:cursor-wait text-white px-6 py-3 rounded-full font-medium transition shadow-md min-w-[180px]"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : (
        <Send className="w-4 h-4" strokeWidth={2.4} />
      )}
      {pending ? 'N ap voye…' : 'Voye mesaj la'}
    </button>
  );
}
