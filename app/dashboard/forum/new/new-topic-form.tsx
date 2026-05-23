'use client';

import React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { createTopic, type TopicState } from '../actions';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['forum_categories']['Row'];

export default function NewTopicForm({
  categories,
}: {
  categories: Category[];
}) {
  const [state, action] = useFormState<TopicState, FormData>(createTopic, {});
  const [categoryId, setCategoryId] = React.useState<string>(
    categories[0]?.id ?? ''
  );

  return (
    <form
      action={action}
      className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6 space-y-5"
    >
      <input type="hidden" name="category_id" value={categoryId} />

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
        >
          Tit
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="ex. Ki tizan ki pi bon pou tansyon wo a?"
          className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
        <p className="mt-1 text-[11px] text-earth-500">
          3 a 200 karaktè. Yon tit klè ede lòt manm yo jwenn sijè w.
        </p>
      </div>

      {/* Category */}
      <fieldset>
        <legend className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-2">
          Kategori
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  'flex items-start gap-2 p-3 rounded-xl border-2 text-left transition',
                  active
                    ? 'border-current'
                    : 'border-cream-200 bg-white hover:border-forest-300'
                )}
                style={
                  active
                    ? {
                        background: `${c.color}10`,
                        color: c.color,
                        borderColor: c.color,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    'grid place-items-center w-9 h-9 rounded-lg text-lg shrink-0',
                    active ? 'bg-white/40' : 'bg-cream-100'
                  )}
                >
                  {c.icon ?? '💬'}
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-sm font-bold',
                      active ? 'text-current' : 'text-ink'
                    )}
                  >
                    {c.name}
                  </div>
                  <div
                    className={cn(
                      'text-[11px] mt-0.5 leading-snug',
                      active ? 'opacity-80' : 'text-earth-600'
                    )}
                  >
                    {c.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Body */}
      <div>
        <label
          htmlFor="body"
          className="block text-xs font-bold uppercase tracking-wide text-earth-700 mb-1.5"
        >
          Mesaj
        </label>
        <textarea
          id="body"
          name="body"
          required
          minLength={1}
          maxLength={8000}
          rows={8}
          placeholder="Eksplike kesyon w lan oswa pataje sa w ap viv… (jiska 8000 karaktè)"
          className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-y leading-relaxed"
        />
        <p className="mt-1 text-[11px] text-earth-500">
          Mete kòmsa: kontèks ou (ki kondisyon, depi kilè), sa w ap chèche
          (yon konsèy, yon eksperyans), ak nenpòt detay enpòtan.
        </p>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-cream-200">
        <Link
          href="/dashboard/forum"
          className="text-sm font-semibold text-earth-700 hover:text-ink transition"
        >
          ← Anile
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 rounded-lg transition shadow-plant"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
      ) : (
        <Send className="w-4 h-4" strokeWidth={2.2} />
      )}
      Pibliye sijè a
    </button>
  );
}
