'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Lightbulb,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Sparkles,
  Bug,
  FileText,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitSuggestion } from '@/app/dashboard/actions';

type Category =
  | 'general'
  | 'ui'
  | 'feature'
  | 'bug'
  | 'content'
  | 'performance'
  | 'other';

const CATEGORY_META: Record<
  Category,
  { label: string; icon: typeof Lightbulb; hint: string }
> = {
  general: {
    label: 'Jeneral',
    icon: Lightbulb,
    hint: 'Yon lide oswa yon obsèvasyon jeneral.',
  },
  ui: {
    label: 'UI / Design',
    icon: Palette,
    hint: 'Yon bagay ki ta pi bèl / pi klè nan aparans lan.',
  },
  feature: {
    label: 'Nouvo fonksyonalite',
    icon: Sparkles,
    hint: 'Yon bagay ou ta renmen w te ka fè.',
  },
  bug: {
    label: 'Bug',
    icon: Bug,
    hint: 'Yon bagay ki pa mache jan li ta dwe.',
  },
  content: {
    label: 'Kontni',
    icon: FileText,
    hint: 'Konsèy, gid, klas — sa w ta renmen wè.',
  },
  performance: {
    label: 'Vitès',
    icon: Zap,
    hint: 'Yon paj ki lan, yon bouton ki tade.',
  },
  other: { label: 'Lòt', icon: MoreHorizontal, hint: 'Yon lòt bagay.' },
};

export default function SuggestionBox() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<Category>('general');
  const [message, setMessage] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<
    { kind: 'success' | 'error'; text: string } | null
  >(null);

  // Reset when closing so the next open is a blank slate.
  React.useEffect(() => {
    if (!open) {
      setFeedback(null);
    }
  }, [open]);

  // Close on Escape.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setFeedback({
        kind: 'error',
        text: 'Antre omwen 5 karaktè pou nou konprann ou.',
      });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      const res = await submitSuggestion({
        category,
        message: trimmed,
        pageUrl: typeof window !== 'undefined' ? window.location.pathname : null,
        userAgent:
          typeof navigator !== 'undefined'
            ? navigator.userAgent.slice(0, 512)
            : null,
      });
      if (res.ok) {
        setFeedback({
          kind: 'success',
          text: 'Mèsi ! Sijesyon w rive lakay ekip la.',
        });
        setMessage('');
        setCategory('general');
        router.refresh();
        window.setTimeout(() => setOpen(false), 1400);
      } else {
        setFeedback({ kind: 'error', text: res.error });
      }
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: (err as Error).message ?? 'Erè enkoni.',
      });
    } finally {
      setPending(false);
    }
  }

  const CategoryIcon = CATEGORY_META[category].icon;

  return (
    <>
      {/* Floating trigger — third slot in the bottom-right stack:
          TranslateSwitcher (bottom-4/6) → RemedFinder (bottom-16/20) →
          Sijesyon (bottom-28/32). Gold to match the brand accent.
          translate="no" so Google can't touch the label. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Voye yon sijesyon"
        translate="no"
        className="notranslate fixed bottom-28 right-4 sm:bottom-32 sm:right-6 z-[99] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold-400 hover:bg-gold-500 text-forest-900 shadow-lg border border-gold-500 transition"
      >
        <Lightbulb className="w-4 h-4" strokeWidth={2.4} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Sijesyon
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="suggestion-title"
          translate="no"
          className="notranslate fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fèmen"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <header className="px-5 py-4 border-b border-cream-100 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="suggestion-title"
                  className="font-display text-lg font-bold text-ink flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-accent" strokeWidth={2.4} />
                  Fè app la vin pi bon
                </h2>
                <p className="text-xs text-earth-600 mt-0.5">
                  Ki sa ki ta ka pi bon nan eksperyans ou? Ekip la ap li chak
                  mesaj.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fèmen"
                className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700 shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </header>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-2 block">
                  Kategori
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map((key) => {
                    const meta = CATEGORY_META[key];
                    const Icon = meta.icon;
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition text-left',
                          active
                            ? 'bg-forest-700 border-forest-700 text-cream-50'
                            : 'bg-white border-cream-200 text-earth-700 hover:border-forest-300'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-earth-500 mt-2 leading-snug">
                  <CategoryIcon
                    className="inline w-3 h-3 mr-1"
                    strokeWidth={2.4}
                  />
                  {CATEGORY_META[category].hint}
                </p>
              </div>

              <div>
                <label
                  htmlFor="suggestion-message"
                  className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
                >
                  Sijesyon w
                </label>
                <textarea
                  id="suggestion-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Egzanp: mwen ta renmen wè yon graf pou pwogrè pwa m sou 3 mwa..."
                  className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink resize-y"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-earth-500">
                    {message.trim().length} / 2000
                  </span>
                  <span className="text-[10px] text-earth-500 italic">
                    Enfòmasyon paj + navigatè yo voye ansanm otomatikman.
                  </span>
                </div>
              </div>

              {feedback && (
                <div
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs flex items-start gap-2',
                    feedback.kind === 'success'
                      ? 'bg-forest-50 border border-forest-200 text-forest-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  )}
                >
                  {feedback.kind === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="px-4 py-2 text-sm font-semibold text-earth-700 hover:text-ink rounded-lg transition disabled:opacity-60"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={pending || message.trim().length < 5}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
                >
                  {pending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
                  ) : (
                    <Send className="w-3.5 h-3.5" strokeWidth={2.4} />
                  )}
                  Voye
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
