'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import {
  toggleResourcePublished,
  deleteResource,
} from './actions';
import { cn } from '@/lib/utils';

export default function ResourceRowActions({
  resourceId,
  initialPublished,
  title,
}: {
  resourceId: string;
  initialPublished: boolean;
  title: string;
}) {
  const router = useRouter();
  const [published, setPublished] = React.useState(initialPublished);
  const [pending, setPending] = React.useState<'toggle' | 'delete' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onToggle() {
    setError(null);
    const prev = published;
    setPublished(!prev);
    setPending('toggle');
    const res = await toggleResourcePublished(resourceId);
    setPending(null);
    if (!res.ok) {
      setPublished(prev);
      setError(res.error);
      return;
    }
    setPublished(res.published);
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm(`Efase resous "${title}"? Sa pa ka anile.`)) return;
    setError(null);
    setPending('delete');
    const res = await deleteResource(resourceId);
    if (!res.ok) {
      setPending(null);
      setError(res.error);
      return;
    }
    // Stay "pending" while router refreshes; row will disappear.
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending !== null}
        title={published ? 'Mete kòm bouyon' : 'Pibliye'}
        className={cn(
          'grid place-items-center w-8 h-8 rounded-lg border transition disabled:opacity-60 disabled:cursor-not-allowed',
          published
            ? 'bg-forest-50 border-forest-200 text-forest-700 hover:bg-forest-100'
            : 'bg-white border-cream-200 text-earth-600 hover:border-forest-300 hover:text-forest-700'
        )}
      >
        {pending === 'toggle' ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
        ) : published ? (
          <Eye className="w-4 h-4" strokeWidth={2.2} />
        ) : (
          <EyeOff className="w-4 h-4" strokeWidth={2.2} />
        )}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending !== null}
        title="Efase"
        className="grid place-items-center w-8 h-8 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending === 'delete' ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
        ) : (
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
        )}
      </button>
      {error && (
        <span className="ml-2 text-[10px] text-rose-700 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
