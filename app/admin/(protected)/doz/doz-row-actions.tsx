'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { toggleDozPublished, deleteDoz } from './actions';

export default function DozRowActions({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<'pub' | 'del' | null>(null);
  const [confirm, setConfirm] = React.useState(false);

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        title={published ? 'Kache' : 'Pibliye'}
        onClick={async () => {
          setBusy('pub');
          await toggleDozPublished(id);
          setBusy(null);
          router.refresh();
        }}
        className="p-1.5 rounded-lg hover:bg-cream-100 text-earth-600"
      >
        {busy === 'pub' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : published ? (
          <Eye className="w-4 h-4 text-forest-600" strokeWidth={2} />
        ) : (
          <EyeOff className="w-4 h-4" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        title="Siprime"
        onClick={async () => {
          if (!confirm) {
            setConfirm(true);
            setTimeout(() => setConfirm(false), 2500);
            return;
          }
          setBusy('del');
          await deleteDoz(id);
          setBusy(null);
          router.refresh();
        }}
        className={`p-1.5 rounded-lg ${confirm ? 'bg-rose-600 text-white' : 'hover:bg-cream-100 text-earth-600'}`}
      >
        {busy === 'del' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={2} />}
      </button>
    </div>
  );
}
