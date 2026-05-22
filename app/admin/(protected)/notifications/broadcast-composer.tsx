'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Megaphone,
  Send,
  Users,
  CreditCard,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sendBroadcastNotification,
  type BroadcastState,
} from './actions';

type Target = 'all' | 'plan' | 'user';

const TARGET_OPTIONS: {
  value: Target;
  label: string;
  icon: typeof Users;
  hint: string;
  tone: string;
}[] = [
  {
    value: 'all',
    label: 'Tout manm',
    icon: Megaphone,
    hint: 'Voye yon mesaj jeneral pou tout kominote a.',
    tone: 'bg-accent/10 text-accent border-accent/30',
  },
  {
    value: 'plan',
    label: 'Pa plan',
    icon: CreditCard,
    hint: 'Sib sèlman manm ki sou yon plan abònman espesifik.',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    value: 'user',
    label: 'Yon manm',
    icon: Mail,
    hint: 'Voye yon mesaj prive pou yon sèl manm pa imel.',
    tone: 'bg-forest-50 text-forest-700 border-forest-200',
  },
];

export default function BroadcastComposer() {
  const [state, action] = useFormState<BroadcastState, FormData>(
    sendBroadcastNotification,
    {}
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const [target, setTarget] = React.useState<Target>('all');

  // Reset form on success
  React.useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
      setTarget('all');
    }
  }, [state.ok]);

  return (
    <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-cream-50 to-white flex items-center gap-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white shadow">
          <Megaphone className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-ink leading-tight">
            Voye yon notifikasyon
          </h2>
          <p className="text-[11px] text-earth-600 mt-0.5">
            Mesaj la pral parèt nan kloch manm yo an direk.
          </p>
        </div>
      </header>

      <form ref={formRef} action={action} className="p-5 space-y-4">
        <input type="hidden" name="target" value={target} />

        {/* Target picker */}
        <fieldset>
          <legend className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-2">
            Sib
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TARGET_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = target === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTarget(opt.value)}
                  className={cn(
                    'flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition',
                    active
                      ? `${opt.tone} border-current`
                      : 'border-cream-200 bg-white text-earth-700 hover:border-forest-300'
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center w-7 h-7 rounded-lg shrink-0',
                      active ? 'bg-white/40' : 'bg-cream-100'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        'text-sm font-bold',
                        active ? 'text-current' : 'text-ink'
                      )}
                    >
                      {opt.label}
                    </div>
                    <div className="text-[10px] leading-snug mt-0.5 opacity-80">
                      {opt.hint}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Conditional target fields */}
        {target === 'plan' && (
          <div>
            <label
              htmlFor="target_plan"
              className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
            >
              Plan ki konsène
            </label>
            <select
              id="target_plan"
              name="target_plan"
              required
              defaultValue="premium"
              className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
            >
              <option value="basic">Bazilik</option>
              <option value="premium">Sitwonèl</option>
              <option value="vip">Melis</option>
            </select>
          </div>
        )}

        {target === 'user' && (
          <div>
            <label
              htmlFor="target_user_email"
              className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
            >
              Imel manm nan
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                strokeWidth={2}
              />
              <input
                type="email"
                id="target_user_email"
                name="target_user_email"
                required
                placeholder="manm@medikaplant.org"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
              />
            </div>
            <p className="mt-1 text-[10px] text-earth-500">
              Manm nan dwe egziste deja nan baz done a.
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
          >
            Tit <span className="text-rose-700">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder="ex. Nouvo gid sou tizan jenjanm"
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
          >
            Mesaj <span className="text-rose-700">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={3}
            minLength={2}
            maxLength={1000}
            placeholder="Ekri mesaj la an Kreyòl…"
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-y leading-relaxed"
          />
          <p className="mt-1 text-[10px] text-earth-500">
            2 a 1000 karaktè. Sa ap parèt nan dropdown kloch la.
          </p>
        </div>

        {/* Link */}
        <div>
          <label
            htmlFor="link_url"
            className="text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5 flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" strokeWidth={2.2} />
            Lyen (opsyonèl)
          </label>
          <input
            id="link_url"
            name="link_url"
            type="text"
            placeholder="/dashboard/guides oswa https://…"
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
          <p className="mt-1 text-[10px] text-earth-500">
            Si w mete yon lyen, klike sou notifikasyon an ap mennen manm
            nan dirèkteman sou paj la.
          </p>
        </div>

        {/* Feedback */}
        {state.error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-800">
            <AlertCircle
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              strokeWidth={2.4}
            />
            <span>{state.error}</span>
          </div>
        )}
        {state.ok && (
          <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2.5 text-xs text-forest-800">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            <span>
              Notifikasyon voye! Manm yo ap wè li nan kloch yo imedyatman.
            </span>
            <Sparkles className="w-3 h-3 text-gold-500 ml-auto" strokeWidth={2.4} />
          </div>
        )}

        <SubmitButton target={target} />
      </form>
    </section>
  );
}

function SubmitButton({ target }: { target: Target }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-gradient-to-r from-accent to-accent-dark hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl transition shadow-lg shadow-accent/20"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : (
        <Send className="w-4 h-4" strokeWidth={2.4} />
      )}
      {target === 'all' && 'Voye sou tout manm'}
      {target === 'plan' && 'Voye sou plan an'}
      {target === 'user' && 'Voye sou manm nan'}
    </button>
  );
}
