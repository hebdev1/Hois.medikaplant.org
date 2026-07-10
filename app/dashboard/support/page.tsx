import { LifeBuoy, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import SupportChat from '@/components/dashboard/support-chat';
import SupportContacts from '@/components/dashboard/support-contacts';
import SupportFaqs from '@/components/dashboard/support-faqs';
import { getOrCreateThread } from './actions';
import type { Database } from '@/types/database';

export const metadata = { title: 'Sipò' };
export const dynamic = 'force-dynamic';

type Faq = Database['public']['Tables']['support_faqs']['Row'];
type Contact = Database['public']['Tables']['support_contacts']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default async function SupportPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // The thread getter creates a welcome message + thread on first visit,
  // so we can call it unconditionally on every page load.
  const threadResult = await getOrCreateThread();

  const [profileResult, faqsResult, contactsResult, unreadCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('support_faqs')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('support_contacts')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
  } | null;

  const faqs = (faqsResult.data ?? []) as Faq[];
  const contacts = (contactsResult.data ?? []) as Contact[];
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik' : 'Hoïs Bazilik';

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1280px]">
        <header className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2.2} />
            Sipò
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Nou disponib, <em className="text-forest-600 not-italic font-bold"> 5 sou 7 </em>.
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl">
            Ekip Hois Medikaplant yo disponib 7 sou 7, chat dirèk, WhatsApp, oswa apèl.
            Repons jeneralman nan mwens ke 60 minit.
          </p>
        </header>

        {!threadResult.ok ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <h2 className="font-semibold text-rose-900">
                Nou pa ka louvri yon konvèsasyon kounye a.
              </h2>
              <p className="text-sm text-rose-800 mt-1">{threadResult.error}</p>
              <p className="text-xs text-rose-700 mt-2">
                Pandan tan an, ou ka rive jwenn nou nan{' '}
                <a className="underline" href="mailto:plant@hoismedikaplant.com">
                  plant@hoismedikaplant.com
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 md:gap-6">
            {/* Left — live chat */}
            <SupportChat
              thread={threadResult.data.thread}
              initialMessages={threadResult.data.messages}
            />

            {/* Right — contacts + FAQs */}
            <aside className="space-y-5 md:space-y-6">
              <SupportContacts contacts={contacts} />
              <SupportFaqs faqs={faqs} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
