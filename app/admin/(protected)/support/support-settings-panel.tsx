'use client';

import React from 'react';
import {
  ChevronDown,
  Clock,
  Loader2,
  Check,
  AlertCircle,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computePresence,
  KREYOL_DAYS,
  WEEK_ORDER,
  type DayHours,
  type SupportSettings,
} from '@/lib/support-presence';
import {
  updateSupportSettings,
  uploadSupportPhoto,
  removeSupportPhoto,
} from './actions';

const MODES: { value: SupportSettings['mode']; label: string; hint: string }[] = [
  { value: 'auto', label: 'Otomatik', hint: 'Selon orè a' },
  { value: 'online', label: 'Fòse anliy', hint: 'Toujou disponib' },
  { value: 'offline', label: 'Fòse fèmen', hint: 'Toujou pa disponib' },
];

const TIMEZONES = [
  { value: 'America/Port-au-Prince', label: 'Ayiti (Pòtoprens)' },
  { value: 'America/New_York', label: 'Etazini — Lès' },
  { value: 'America/Montreal', label: 'Kanada (Monreyal)' },
  { value: 'Europe/Paris', label: 'Frans (Pari)' },
];

export default function SupportSettingsPanel({
  initial,
}: {
  initial: SupportSettings;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [mode, setMode] = React.useState<SupportSettings['mode']>(initial.mode);
  const [hours, setHours] = React.useState<DayHours[]>(initial.hours);
  const [timezone, setTimezone] = React.useState(initial.timezone);
  const [offlineMessage, setOfflineMessage] = React.useState(initial.offlineMessage);
  const [agentName, setAgentName] = React.useState(initial.agentName ?? '');
  const [agentRole, setAgentRole] = React.useState(initial.agentRole ?? '');
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(initial.agentPhotoUrl);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const photoRef = React.useRef<HTMLInputElement>(null);

  const preview = computePresence({
    mode,
    hours,
    timezone,
    offlineMessage,
    agentName: agentName || null,
    agentRole: agentRole || null,
    agentPhotoUrl: photoUrl,
  });

  function setDay(index: number, patch: Partial<DayHours>) {
    setHours((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
    setSaved(false);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const res = await updateSupportSettings({
      mode,
      hours,
      timezone,
      offlineMessage,
      agentName: agentName.trim() || null,
      agentRole: agentRole.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadSupportPhoto(fd);
    setUploadingPhoto(false);
    if (res.ok) setPhotoUrl(res.url);
    else setError(res.error);
  }

  async function onRemovePhoto() {
    setUploadingPhoto(true);
    setError(null);
    const res = await removeSupportPhoto();
    setUploadingPhoto(false);
    if (res.ok) setPhotoUrl(null);
    else setError(res.error);
  }

  return (
    <div className="mb-5 bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
      {/* Header row (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 md:px-5 py-3.5 text-left hover:bg-cream-50/60 transition"
      >
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent/10 text-accent shrink-0">
          <Clock className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-bold text-ink">
            Paramèt sipò — disponiblite &amp; foto
          </div>
          <div className="text-[11px] text-earth-600">
            Orè, mòd anliy/fèmen, mesaj fèmen, ak foto ekip sipò a.
          </div>
        </div>
        <span
          className={cn(
            'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
            preview.online
              ? 'bg-forest-50 text-forest-700'
              : 'bg-cream-100 text-earth-600'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              preview.online ? 'bg-forest-500' : 'bg-earth-300'
            )}
          />
          {preview.online ? 'An liy kounye a' : 'Pa disponib kounye a'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-earth-500 transition-transform shrink-0',
            expanded && 'rotate-180'
          )}
          strokeWidth={2.2}
        />
      </button>

      {expanded && (
        <div className="border-t border-cream-200 px-4 md:px-5 py-5 space-y-6">
          {/* Availability mode */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-earth-500">
              Mòd disponiblite
            </h3>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMode(m.value);
                    setSaved(false);
                  }}
                  className={cn(
                    'flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition',
                    mode === m.value
                      ? 'border-forest-400 bg-forest-50 ring-1 ring-forest-200'
                      : 'border-cream-200 hover:border-forest-300'
                  )}
                >
                  <span className="text-sm font-semibold text-ink">{m.label}</span>
                  <span className="text-[10px] text-earth-500">{m.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Weekly hours */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-earth-500">
                Orè chak semèn
              </h3>
              <label className="flex items-center gap-2 text-[11px] text-earth-600">
                Fizo orè
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    setSaved(false);
                  }}
                  className="text-xs bg-cream-50 border border-cream-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-forest-200"
                >
                  {TIMEZONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className={cn(
                'space-y-1.5 transition',
                mode !== 'auto' && 'opacity-50 pointer-events-none'
              )}
            >
              {WEEK_ORDER.map((dayIndex) => {
                const d = hours[dayIndex];
                return (
                  <div
                    key={dayIndex}
                    className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-cream-50/60"
                  >
                    <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.enabled}
                        onChange={(e) => setDay(dayIndex, { enabled: e.target.checked })}
                        className="w-4 h-4 accent-forest-600"
                      />
                      <span className="text-sm font-medium text-ink">
                        {KREYOL_DAYS[dayIndex]}
                      </span>
                    </label>
                    {d.enabled ? (
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={d.start}
                          onChange={(e) => setDay(dayIndex, { start: e.target.value })}
                          className="bg-white border border-cream-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-forest-200"
                        />
                        <span className="text-earth-400">→</span>
                        <input
                          type="time"
                          value={d.end}
                          onChange={(e) => setDay(dayIndex, { end: e.target.value })}
                          className="bg-white border border-cream-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-forest-200"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-earth-400 italic">Fèmen</span>
                    )}
                  </div>
                );
              })}
            </div>
            {mode !== 'auto' && (
              <p className="text-[11px] text-earth-500 italic">
                Orè yo aplike sèlman nan mòd «&nbsp;Otomatik&nbsp;».
              </p>
            )}
          </section>

          {/* Offline message */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-earth-500">
              Mesaj lè nou pa disponib
            </h3>
            <textarea
              value={offlineMessage}
              onChange={(e) => {
                setOfflineMessage(e.target.value);
                setSaved(false);
              }}
              rows={2}
              className="w-full max-w-xl resize-none px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </section>

          {/* Agent identity + photo */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-earth-500">
              Idantite ekip sipò a
            </h3>
            <div className="flex items-start gap-4">
              <div className="shrink-0 text-center">
                <div className="relative w-16 h-16">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt="Foto sipò"
                      className="w-16 h-16 rounded-full object-cover border border-cream-200"
                    />
                  ) : (
                    <div
                      className="grid place-items-center w-16 h-16 rounded-full text-cream-50 font-display font-bold text-lg"
                      style={{ backgroundImage: 'linear-gradient(135deg, #e78e17, #985c0c)' }}
                    >
                      {(agentName.trim()[0] ?? 'H').toUpperCase()}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/40">
                      <Loader2 className="w-4 h-4 animate-spin text-cream-50" />
                    </span>
                  )}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={onPickPhoto}
                />
                <div className="flex flex-col items-center gap-1 mt-2">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900 disabled:opacity-50"
                  >
                    <ImagePlus className="w-3 h-3" strokeWidth={2.2} />
                    {photoUrl ? 'Chanje' : 'Ajoute foto'}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={2.2} />
                      Retire
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-3 max-w-xl">
                <label className="block">
                  <span className="text-[11px] font-semibold text-earth-600">Non</span>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => {
                      setAgentName(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Mèt Joseph"
                    className="mt-1 w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-earth-600">Wòl</span>
                  <input
                    type="text"
                    value={agentRole}
                    onChange={(e) => {
                      setAgentRole(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Èrboris santiniye"
                    className="mt-1 w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </label>
              </div>
            </div>
            <p className="text-[11px] text-earth-500">
              Foto ak non sa yo parèt anlè nan chat kliyan an. Si w kite yo vid,
              n ap itilize valè pa defo yo.
            </p>
          </section>

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-sm font-semibold transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
              ) : saved ? (
                <Check className="w-4 h-4" strokeWidth={2.4} />
              ) : null}
              {saved ? 'Anrejistre!' : 'Anrejistre paramèt yo'}
            </button>
            {error && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-700">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
