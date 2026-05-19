'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { exportUserData, deleteAccount } from '@/app/dashboard/settings/actions';

export default function DangerZonePanel() {
  return (
    <section className="bg-white border border-rose-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-rose-100 text-rose-700 shrink-0">
          <ShieldAlert className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="font-display text-lg md:text-xl font-bold text-ink">
            Zòn Danje
          </h2>
          <p className="text-sm text-earth-600 mt-1">
            Done ou ak kont ou. Aksyon yo isit la pèmanan.
          </p>
        </div>
      </header>

      <div className="space-y-5 divide-y divide-cream-200/60">
        <ExportRow />
        <DeleteRow />
      </div>
    </section>
  );
}

function ExportRow() {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  async function onExport() {
    setStatus('loading');
    setError(null);
    const res = await exportUserData();
    if (!res.ok) {
      setError(res.error);
      setStatus('error');
      return;
    }
    // Stream JSON to the browser as a download
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = res.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2600);
  }

  return (
    <div className="pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">Telechaje tout done m</div>
          <div className="text-xs text-earth-600 mt-0.5 max-w-xl">
            Yon fichye JSON ki gen pwofil ou, preferans, enfòmasyon medikal,
            sibskripsyon, log sante, konsiltasyon, ak pwogrè ou. Konfòmite ak
            dwa GDPR ak pòtabilite done.
          </div>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition w-fit"
        >
          {status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : (
            <Download className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
          Telechaje JSON
        </button>
      </div>
      {status === 'success' && (
        <p className="mt-2 text-xs text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
          Fichye a telechaje.
        </p>
      )}
      {status === 'error' && error && (
        <p className="mt-2 text-xs text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
        </p>
      )}
    </div>
  );
}

const CONFIRM_PHRASE = 'EFASE KONT MWEN';

function DeleteRow() {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [phrase, setPhrase] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (phrase !== CONFIRM_PHRASE) return;
    setStatus('loading');
    setError(null);
    const res = await deleteAccount();
    if (!res.ok) {
      setError(res.error);
      setStatus('error');
      return;
    }
    // Account is gone — redirect to homepage with a goodbye message
    router.replace('/?account_deleted=1');
    router.refresh();
  }

  return (
    <div className="pt-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-rose-800">Efase kont mwen</div>
          <div className="text-xs text-earth-600 mt-0.5 max-w-xl">
            Aksyon sa a pèmanan. Tout done w yo ap efase pou tout tan: pwofil,
            sibskripsyon, log sante, konsiltasyon, badj, foto, ak tout istwa.
            Pa gen retou.
          </div>
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Efase kont
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-start gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <p className="text-sm text-rose-900 font-semibold">
                Èske w sèten ou vle efase kont ou pou tout tan?
              </p>
              <p className="text-xs text-rose-800 mt-1">
                Pou konfime, tape egzatkteman:{' '}
                <code className="bg-white border border-rose-200 px-1.5 py-0.5 rounded font-mono">
                  {CONFIRM_PHRASE}
                </code>
              </p>
            </div>
          </div>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            disabled={status === 'loading'}
            autoComplete="off"
            className="w-full px-3 py-2 text-sm font-mono bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={phrase !== CONFIRM_PHRASE || status === 'loading'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              {status === 'loading' && (
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
              )}
              Wi, efase kont mwen pou tout tan
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPhrase('');
                setError(null);
                setStatus('idle');
              }}
              disabled={status === 'loading'}
              className="px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-ink transition"
            >
              Anile
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-700 inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
