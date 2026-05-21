'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Bell, Send, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';
import { adminSendDirectNotification, type NotificationState } from '../actions';

export default function DirectNotificationForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const action = adminSendDirectNotification.bind(null, userId);
  const [state, formAction] = useFormState<NotificationState, FormData>(action, {});
  const formRef = React.useRef<HTMLFormElement>(null);

  // Reset on success
  React.useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 text-accent">
            <Bell className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink leading-tight">
              Voye yon notifikasyon dirèk
            </h2>
            <p className="text-xs text-earth-600 mt-0.5">
              Pou <span className="font-medium text-earth-700">{email}</span> sèlman — l ap parèt nan kloch li yo.
            </p>
          </div>
        </div>
      </header>

      <form ref={formRef} action={formAction} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-earth-700 mb-1.5">
            Tit
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder="ex. Pwopozisyon tretman pou ou"
            className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-earth-700 mb-1.5">
            Mesaj
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={2}
            maxLength={1000}
            rows={3}
            placeholder="Ekri mesaj la an Kreyòl…"
            className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-y"
          />
        </div>

        <div>
          <label htmlFor="link_url" className="block text-xs font-semibold text-earth-700 mb-1.5 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" strokeWidth={2.2} />
            Lyen (opsyonèl)
          </label>
          <input
            id="link_url"
            name="link_url"
            type="text"
            placeholder="/dashboard/health oswa https://…"
            className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
          <p className="mt-1 text-[10px] text-earth-500">
            Si w mete yon lyen, kloch la ap mennen pasyan an dirèk sou paj la.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <FormFeedback state={state} />
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 rounded-lg transition"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
      ) : (
        <Send className="w-4 h-4" strokeWidth={2.2} />
      )}
      Voye notifikasyon
    </button>
  );
}

function FormFeedback({ state }: { state: NotificationState }) {
  if (state.error) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-700">
        <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
        {state.error}
      </span>
    );
  }
  if (state.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-forest-700">
        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
        Notifikasyon voye!
      </span>
    );
  }
  return <span className="text-[10px] text-earth-500">Pasyan an ap wè li imedyatman.</span>;
}
