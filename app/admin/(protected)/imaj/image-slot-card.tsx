'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, Link2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { uploadSiteImage, setSiteImageUrl, resetSiteImage } from './actions';

type Props = {
  slotKey: string;
  label: string;
  /** What the homepage renders today (override if set, else the default). */
  current: string;
  /** True when an admin has already replaced this slot. */
  overridden: boolean;
};

export default function ImageSlotCard({ slotKey, label, current, overridden }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(current);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok?: boolean; error?: string; url?: string }>, okText: string) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.error) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      // Bust the browser cache so the new file shows immediately.
      setPreview((res.url ?? current) + '?v=' + Date.now());
      setMsg({ ok: true, text: okText });
      setShowUrl(false);
      setUrl('');
    });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    run(() => uploadSiteImage(slotKey, fd), 'Imaj la chanje.');
    e.target.value = '';
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-slate-100">
        {/* Plain <img>: admin previews don't need next/image optimisation and
            this keeps arbitrary external URLs working without config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt={label} className="w-full h-full object-cover" />
        {overridden && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-semibold">
            Chanje
          </span>
        )}
        {pending && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-medium text-ink">
            N ap travay…
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-ink truncate" title={label}>
          {label}
        </p>

        <div className="flex gap-1.5 mt-auto">
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Chanje
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowUrl((v) => !v)}
            title="Sèvi ak yon lyen"
            className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          {overridden && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => resetSiteImage(slotKey), 'Imaj default la tounen.')}
              title="Remete imaj default la"
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showUrl && (
          <div className="flex gap-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
            <button
              type="button"
              disabled={pending || !url}
              onClick={() => run(() => setSiteImageUrl(slotKey, url), 'Lyen an anrejistre.')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-40"
            >
              OK
            </button>
          </div>
        )}

        {msg && (
          <p
            className={`inline-flex items-center gap-1 text-[11px] ${
              msg.ok ? 'text-brand-700' : 'text-red-600'
            }`}
          >
            {msg.ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {msg.text}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          className="hidden"
        />
      </div>
    </div>
  );
}
