'use client';

import React from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { changePassword } from '@/app/dashboard/settings/actions';

type Status = 'idle' | 'saving' | 'success' | 'error';

export default function PasswordSection() {
  const [open, setOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setStatus('idle');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    const res = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!res.ok) {
      setError(res.error);
      setStatus('error');
      return;
    }
    setStatus('success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setStatus('idle');
      setOpen(false);
    }, 1800);
  }

  // Live strength hints
  const len = newPassword.length;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
  const score = [len >= 8, len >= 12, hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
  const strength = score <= 2 ? 'fèb' : score <= 3 ? 'mwayen' : score <= 4 ? 'fò' : 'trè fò';
  const strengthColor =
    score <= 2 ? 'bg-rose-500' : score <= 3 ? 'bg-amber-500' : score <= 4 ? 'bg-forest-500' : 'bg-forest-700';

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-5">
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Sekirite
        </h2>
        <p className="text-sm text-earth-600 mt-1">
          Modpas ou ak otantifikasyon kont ou.
        </p>
      </header>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">Modpas</div>
            <div className="text-xs text-earth-600 mt-0.5">
              Yon modpas djanm pwoteje kont ou. Chanje l si w panse li konpwomèt.
            </div>
          </div>
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition w-fit"
            >
              <KeyRound className="w-3.5 h-3.5" strokeWidth={2.2} />
              Chanje modpas
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="text-xs font-semibold text-earth-700 hover:text-ink transition"
            >
              Anile
            </button>
          )}
        </div>

        {open && (
          <form onSubmit={onSubmit} className="rounded-xl border border-cream-200 bg-cream-50/50 p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-earth-700">
                Modpas aktyèl
              </label>
              <div className="mt-1 relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                  strokeWidth={2.2}
                />
                <input
                  type={show ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
                  placeholder="Modpas ou genyen kounye a"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-earth-700">
                Nouvo modpas
              </label>
              <div className="mt-1 relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                  strokeWidth={2.2}
                />
                <input
                  type={show ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
                  placeholder="Omwen 8 karaktè"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Kache modpas' : 'Montre modpas'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md text-earth-500 hover:text-ink hover:bg-cream-100 transition"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-cream-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${strengthColor}`}
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-earth-600 capitalize w-14 text-right">
                    {strength}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-earth-700">
                Konfime modpas
              </label>
              <div className="mt-1 relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                  strokeWidth={2.2}
                />
                <input
                  type={show ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
                  placeholder="Repete menm modpas la"
                />
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-700 inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
                  Modpas yo pa menm.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                {status === 'error' && error && (
                  <p className="text-xs text-rose-700 inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
                  </p>
                )}
                {status === 'success' && (
                  <p className="text-xs text-forest-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                    Modpas chanje ak siksè.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  status === 'saving' ||
                  currentPassword.length === 0 ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 rounded-lg transition"
              >
                {status === 'saving' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
                )}
                Anrejistre nouvo modpas
              </button>
            </div>
          </form>
        )}

        <div className="pt-5 border-t border-cream-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                Otantifikasyon de etap (2FA)
              </div>
              <div className="text-xs text-earth-600 mt-0.5">
                Yon nivo sekirite siplemantè ki vinn byento.
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-100 text-earth-700 text-[11px] font-semibold uppercase tracking-wide border border-cream-200">
              Pa pwòch
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
