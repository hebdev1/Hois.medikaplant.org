'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AcceptInviteForm({
  token,
  inviteEmail,
  firstName,
  lastName,
  alreadySignedIn,
  signedInEmail,
}: {
  token: string;
  inviteEmail: string;
  firstName: string;
  lastName: string;
  alreadySignedIn: boolean;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  // If signed in as a DIFFERENT account than the invite target, we ask
  // them to sign out first — the invite is locked to the email.
  const mismatch =
    alreadySignedIn &&
    signedInEmail !== null &&
    signedInEmail.toLowerCase() !== inviteEmail.toLowerCase();

  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onAcceptSignedIn() {
    setPending(true);
    setError(null);
    const { error: rpcErr } = await supabase.rpc('consume_admin_invite', {
      p_token: token,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      setPending(false);
      return;
    }
    // Refresh session so app_admin_role JWT claim picks up immediately.
    await supabase.auth.refreshSession();
    setDone(true);
    setTimeout(() => router.replace('/admin'), 700);
  }

  async function onSignupAndAccept(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Modpas la dwe gen omwen 8 karaktè.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Mete omwen yon lèt ak yon chif nan modpas la.');
      return;
    }
    if (password !== confirm) {
      setError('De modpas yo pa menm.');
      return;
    }

    setPending(true);
    setError(null);

    // 1. Sign up with the invite email (this creates the auth user and
    //    triggers handle_new_user to insert a profile row with
    //    role='user' by default).
    const { error: signupErr } = await supabase.auth.signUp({
      email: inviteEmail,
      password,
      options: {
        data: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        },
      },
    });
    if (signupErr) {
      // If the email already has an auth account, ask them to sign in
      // and accept from there (we surface the message verbatim).
      setError(signupErr.message);
      setPending(false);
      return;
    }

    // 2. Make sure we have an authenticated session. signUp() returns one
    //    when email confirmation is OFF; if confirmation is ON, the user
    //    will need to confirm before consuming the invite. Try
    //    signInWithPassword as a fallback to cover both cases.
    let { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      const { error: signinErr } = await supabase.auth.signInWithPassword({
        email: inviteEmail,
        password,
      });
      if (signinErr) {
        setError(
          'Kont ou kreye, men nou pa ka konekte w otomatikman. Tcheke imèl ou pou konfime kont la, epi tounen sou lyen sa.'
        );
        setPending(false);
        return;
      }
      ({ data: sess } = await supabase.auth.getSession());
    }

    // 3. Consume the invite — RPC checks token + email match server-side.
    const { error: rpcErr } = await supabase.rpc('consume_admin_invite', {
      p_token: token,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      setPending(false);
      return;
    }
    await supabase.auth.refreshSession();
    setDone(true);
    setTimeout(() => router.replace('/admin'), 700);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-800 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
        Byenveni! N ap voye w nan panel admin nan…
      </div>
    );
  }

  if (mismatch) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <div>
            <strong>Ou konekte ak yon lòt kont</strong> ({signedInEmail}).
            Envitasyon sa se pou <strong>{inviteEmail}</strong>. Dekonèkte
            premye epi tounen sou lyen sa.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.refresh();
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          Dekonèkte
        </button>
      </div>
    );
  }

  if (alreadySignedIn) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-cream-50 border border-cream-200 px-4 py-3 text-sm text-earth-700 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-forest-700" strokeWidth={2.2} />
          Ou deja konekte ak <strong>{signedInEmail}</strong>. Klike anba a pou
          aksepte envitasyon an epi resevwa wòl admin ou.
        </div>
        <button
          type="button"
          onClick={onAcceptSignedIn}
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
          Aksepte envitasyon
        </button>
        {error && (
          <p className="text-[11px] text-rose-700 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSignupAndAccept} className="space-y-4">
      <div>
        <span className="text-xs font-semibold text-earth-700 flex items-center gap-1.5 mb-1">
          <Mail className="w-3.5 h-3.5" strokeWidth={2.2} />
          Imèl
        </span>
        <input
          type="email"
          value={inviteEmail}
          disabled
          className={cn(inputClass, 'bg-cream-50 cursor-not-allowed')}
        />
        <p className="text-[10px] text-earth-500 mt-1">
          Envitasyon an konekte ak imèl sa. Ou pa ka chanje li la a.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <span className="text-xs font-semibold text-earth-700 mb-1 block">
            Prenon
          </span>
          <input
            type="text"
            defaultValue={firstName}
            disabled
            className={cn(inputClass, 'bg-cream-50 cursor-not-allowed')}
          />
        </div>
        <div>
          <span className="text-xs font-semibold text-earth-700 mb-1 block">
            Non
          </span>
          <input
            type="text"
            defaultValue={lastName}
            disabled
            className={cn(inputClass, 'bg-cream-50 cursor-not-allowed')}
          />
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-earth-700 flex items-center gap-1.5 mb-1">
          <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
          Modpas
        </span>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            autoComplete="new-password"
            placeholder="Omwen 8 karaktè, ak yon lèt + chif"
            className={cn(inputClass, 'pr-10')}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? 'Kache modpas' : 'Montre modpas'}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded text-earth-500 hover:text-ink hover:bg-cream-100 transition"
          >
            {showPwd ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-earth-700 mb-1 block">
          Konfime modpas
        </span>
        <input
          type={showPwd ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={pending}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
        Kreye kont admin
      </button>
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60';
