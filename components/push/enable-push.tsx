'use client';

import React from 'react';
import { BellRing, BellOff, Loader2, Smartphone } from 'lucide-react';
import { savePushSubscription, deletePushSubscription } from './push-actions';

// VAPID public key: base64url → Uint8Array for PushManager.subscribe.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State =
  | 'checking'
  | 'unsupported'
  | 'ios-hint'
  | 'off'
  | 'on'
  | 'denied'
  | 'working'
  | 'error';

export default function EnablePush() {
  const [state, setState] = React.useState<State>('checking');
  const [error, setError] = React.useState<string | null>(null);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  React.useEffect(() => {
    (async () => {
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      if (!supported) {
        const isIOS =
          typeof navigator !== 'undefined' &&
          /iphone|ipad|ipod/i.test(navigator.userAgent);
        // iOS gains PushManager only once the site is added to the Home Screen.
        setState(isIOS ? 'ios-hint' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') return setState('denied');
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setState(sub ? 'on' : 'off');
      } catch {
        setState('off');
      }
    })();
  }, []);

  async function enable() {
    if (!vapid) {
      setError('Konfigirasyon push la poko fin fèt sou sèvè a.');
      return setState('error');
    }
    setState('working');
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState(perm === 'denied' ? 'denied' : 'off');
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        userAgent: navigator.userAgent,
      });
      if (!res.ok) {
        setError(res.error ?? 'Yon erè rive.');
        return setState('error');
      }
      setState('on');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yon erè rive.');
      setState('error');
    }
  }

  async function disable() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } catch {
      /* ignore — best effort */
    }
    setState('off');
  }

  const shell =
    'flex items-start gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-card';

  if (state === 'checking') return null;

  if (state === 'unsupported' || state === 'ios-hint') {
    return (
      <div className={shell}>
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-cream-100 text-earth-600 shrink-0">
          <Smartphone className="w-5 h-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 text-sm">
          <div className="font-bold text-ink">Notifikasyon sou aparèy ou</div>
          <p className="text-earth-600 mt-0.5 leading-relaxed">
            {state === 'ios-hint'
              ? 'Sou iPhone, pou resevwa notifikasyon: louvri meni pataje a epi chwazi « Ajoute sou ekran akèy » — apre sa, louvri sit la soti la epi aktive notifikasyon yo.'
              : 'Navigatè sa a pa sipòte notifikasyon push. Eseye Chrome oswa Safari ki ajou.'}
          </p>
        </div>
      </div>
    );
  }

  const on = state === 'on';
  const working = state === 'working';

  return (
    <div className={shell}>
      <span
        className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
          on ? 'bg-forest-100 text-forest-700' : 'bg-cream-100 text-earth-600'
        }`}
      >
        {on ? (
          <BellRing className="w-5 h-5" strokeWidth={2.2} />
        ) : (
          <BellOff className="w-5 h-5" strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-ink text-sm">Notifikasyon sou aparèy ou</div>
        <p className="text-xs text-earth-600 mt-0.5 leading-relaxed">
          {on
            ? 'Aktive — w ap resevwa notifikasyon menm lè sit la fèmen.'
            : state === 'denied'
              ? 'Ou te bloke notifikasyon yo. Chanje sa nan paramèt navigatè a pou sit sa a.'
              : 'Resevwa yon avi sou telefòn/òdinatè w menm lè sit la fèmen.'}
        </p>
        {error && <p className="text-xs text-rose-700 mt-1">{error}</p>}
      </div>
      {state !== 'denied' && (
        <button
          type="button"
          onClick={on ? disable : enable}
          disabled={working}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
            on
              ? 'border border-cream-200 text-earth-700 hover:border-rose-300 hover:text-rose-700'
              : 'bg-forest-700 text-cream-50 hover:bg-forest-800'
          }`}
        >
          {working && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />}
          {on ? 'Dezaktive' : 'Aktive'}
        </button>
      )}
    </div>
  );
}
