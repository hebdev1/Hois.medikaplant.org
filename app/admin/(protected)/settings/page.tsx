import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Shield,
  UserPlus,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  ADMIN_ROLE_LABEL,
  ADMIN_ROLE_DESCRIPTION,
  type AdminRole,
} from '../admin-nav-config';
import AdminSettingsForm from './admin-settings-form';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Paramèt' };
export const dynamic = 'force-dynamic';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PrefsRow = Database['public']['Tables']['user_preferences']['Row'];

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [profileResult, prefsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data as ProfileRow | null;
  if (!profile) redirect('/admin/login');

  // Self-heal a preferences row if it's missing. Admins inherit the same
  // user_preferences table as regular members — the columns we surface in
  // the form (email_notifications, weekly_summary_email, ...) all default
  // to sensible values at the DB level.
  let prefs = prefsResult.data as PrefsRow | null;
  if (!prefs) {
    const { data: created } = await supabase
      .from('user_preferences')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    prefs = created as PrefsRow | null;
  }

  const adminRole = (profile.admin_role ?? null) as AdminRole | null;
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.full_name ||
    profile.email.split('@')[0];
  const initials = (profile.first_name?.[0] ?? profile.email[0] ?? 'A').toUpperCase();

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <SettingsIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Paramèt
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Paramèt kont admin ou
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Konfigire idantite w, non w nan sipò chat, sekirite kont, ak imèl
          ou resevwa nan men platfòm la. Chanjman yo aplike imedyatman.
        </p>
      </header>

      {/* Identity card — shows who you are + your assigned role */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-2xl shrink-0 shadow-plant">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-bold text-ink truncate">
              {fullName}
            </div>
            <div className="text-sm text-earth-600 truncate">{profile.email}</div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-accent/10 text-accent">
                <Shield className="w-3 h-3" strokeWidth={2.4} />
                {adminRole ? ADMIN_ROLE_LABEL[adminRole] : 'Administratè'}
              </span>
              {profile.support_persona_name && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-earth-700 px-2 py-1 rounded-full bg-cream-100 border border-cream-200">
                  Sipò chat: {profile.support_persona_name}
                </span>
              )}
            </div>
            {adminRole && (
              <p className="text-[11px] text-earth-600 mt-2 leading-relaxed max-w-xl">
                {ADMIN_ROLE_DESCRIPTION[adminRole]}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Envite admin — surfaces the existing /admin/users/new flow inline
          so a super_admin can spin up new staff invites without hunting
          for it in the Users area. Restricted to super_admin since the
          invite flow already gates on that role server-side. */}
      {adminRole === 'super_admin' && (
        <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card mb-6">
          <header className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                <UserPlus className="w-3 h-3" strokeWidth={2.4} />
                Envite yon admin
              </div>
              <h2 className="font-display text-lg font-bold text-ink">
                Ajoute yon manm nan ekip admin lan
              </h2>
              <p className="text-sm text-earth-600 mt-1 max-w-lg leading-relaxed">
                Envite yon kòlèg pou yon wòl espesifik (modèratè, sipò,
                editè kontni). Yo resevwa yon imèl ak yon lyen pèsonèl pou
                kreye kont yo + chwazi modpas.
              </p>
            </div>
            <Link
              href="/admin/users/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition shrink-0"
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={2.4} />
              Voye yon envitasyon
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </header>
        </section>
      )}

      <AdminSettingsForm
        initial={{
          firstName: profile.first_name ?? '',
          lastName: profile.last_name ?? '',
          email: profile.email,
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          supportPersonaName: profile.support_persona_name ?? '',
          notifications: {
            email_notifications: prefs?.email_notifications ?? true,
            daily_advice_email: prefs?.daily_advice_email ?? false,
            weekly_summary_email: prefs?.weekly_summary_email ?? true,
            badge_unlock_email: prefs?.badge_unlock_email ?? false,
          },
        }}
      />
    </div>
  );
}
