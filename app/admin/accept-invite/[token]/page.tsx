import { Leaf, Shield, AlertCircle, Clock, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_ROLE_LABEL } from '../../(protected)/admin-nav-config';
import AcceptInviteForm from './accept-invite-form';

export const metadata = { title: 'MedikaPlant · Aksepte envitasyon admin' };
export const dynamic = 'force-dynamic';

type InviteRow = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  admin_role:
    | 'super_admin'
    | 'admin'
    | 'support'
    | 'moderator'
    | 'content'
    | null;
  is_valid: boolean;
  is_expired: boolean;
  is_consumed: boolean;
};

export default async function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data: rawInvite } = await supabase
    .rpc('get_admin_invite', { p_token: params.token })
    .single();
  const invite = rawInvite as InviteRow | null;

  // Is the visitor already authenticated? If yes, show the "accept"
  // action directly; if not, show the inline signup form.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const inviteValid = invite?.is_valid ?? false;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="px-5 md:px-10 py-5 flex items-center gap-2">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-gradient text-white shadow">
          <Leaf className="w-4 h-4" strokeWidth={2.4} />
        </span>
        <span className="font-display font-bold text-ink">MedikaPlant</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {!invite || !inviteValid ? (
            <InvalidInviteCard invite={invite} />
          ) : (
            <section className="bg-white border border-cream-200 rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-start gap-3 mb-5">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-accent/10 text-accent shrink-0">
                  <Shield className="w-5 h-5" strokeWidth={2.2} />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink leading-tight">
                    Ou envite kòm admin
                  </h1>
                  <p className="text-sm text-earth-600 mt-1.5">
                    Yon super-admin nan MedikaPlant envite{' '}
                    <strong>{invite.email}</strong> kòm{' '}
                    <strong className="text-accent">
                      {ADMIN_ROLE_LABEL[invite.admin_role!]}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <AcceptInviteForm
                token={params.token}
                inviteEmail={invite.email!}
                firstName={invite.first_name ?? ''}
                lastName={invite.last_name ?? ''}
                alreadySignedIn={!!user}
                signedInEmail={user?.email ?? null}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function InvalidInviteCard({ invite }: { invite: InviteRow | null }) {
  let title = 'Envitasyon pa egziste';
  let detail = 'Lyen sa pa konekte ak okenn envitasyon valid.';
  let Icon = AlertCircle;

  if (invite?.is_consumed) {
    title = 'Envitasyon deja itilize';
    detail =
      'Yon admin deja kreye kont yo ak lyen sa. Konekte nòmalman nan /admin/login.';
    Icon = Check;
  } else if (invite?.is_expired) {
    title = 'Envitasyon ekspire';
    detail =
      'Envitasyon sa pase dat limit la. Mande super-admin lan jenere yon nouvo lyen.';
    Icon = Clock;
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-6 md:p-8 shadow-card text-center">
      <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 mb-4">
        <Icon className="w-6 h-6" strokeWidth={2.2} />
      </span>
      <h1 className="font-display text-xl font-bold text-ink mb-2">{title}</h1>
      <p className="text-sm text-earth-600 max-w-sm mx-auto">{detail}</p>
    </section>
  );
}
