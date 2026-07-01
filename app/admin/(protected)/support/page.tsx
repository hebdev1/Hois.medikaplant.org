import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SupportInbox from './support-inbox';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Sipò' };
export const dynamic = 'force-dynamic';

type ThreadRow = Database['public']['Tables']['support_threads']['Row'];
type MessageRow = Database['public']['Tables']['support_messages']['Row'];

type Profile = { id: string; email: string; full_name: string | null };

export default async function AdminSupportPage() {
  const supabase = createClient();

  // Current admin — used to render their own display name in the chat
  // composer placeholder (was hard-coded "Mèt Joseph" before). The
  // support_persona_name override lets each admin tweak how their name
  // appears in the support chat without renaming their profile.
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) redirect('/admin/login');

  let adminPersona = 'Sipò MedikaPlant';
  const { data: meRaw } = await supabase
    .from('profiles')
    .select('full_name, first_name, last_name, email, support_persona_name, admin_role')
    .eq('id', currentUser.id)
    .maybeSingle();
  const me = meRaw as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    support_persona_name: string | null;
    admin_role: AdminRole | null;
  } | null;
  if (!hasCapability(me?.admin_role, 'reply_support')) {
    redirect('/admin');
  }
  if (me) {
    adminPersona =
      me.support_persona_name?.trim() ||
      me.full_name?.trim() ||
      [me.first_name, me.last_name].filter(Boolean).join(' ').trim() ||
      me.email.split('@')[0];
  }

  // Fetch all threads (admins can see all via RLS)
  const { data: threadsRaw } = await supabase
    .from('support_threads')
    .select('*')
    .order('last_message_at', { ascending: false });

  const threads = (threadsRaw ?? []) as ThreadRow[];
  const userIds = Array.from(new Set(threads.map((t) => t.user_id)));
  const threadIds = threads.map((t) => t.id);

  // Fetch user profiles + latest message per thread in parallel
  const [profilesResult, messagesResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    threadIds.length > 0
      ? supabase
          .from('support_messages')
          .select('id, thread_id, sender_role, body, created_at')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileById = new Map<string, Profile>(
    ((profilesResult.data ?? []) as Profile[]).map((p) => [p.id, p])
  );

  const lastMessageByThread = new Map<
    string,
    Pick<MessageRow, 'id' | 'sender_role' | 'body' | 'created_at'>
  >();
  const unreadByThread = new Map<string, number>();
  for (const m of (messagesResult.data ?? []) as Array<
    Pick<MessageRow, 'id' | 'thread_id' | 'sender_role' | 'body' | 'created_at'>
  >) {
    if (!lastMessageByThread.has(m.thread_id)) {
      lastMessageByThread.set(m.thread_id, m);
    }
    // Count user messages received since the last agent reply per thread
    // (cheap "unread for admin" proxy)
    if (m.sender_role === 'user') {
      const thread = threads.find((t) => t.id === m.thread_id);
      if (thread && new Date(m.created_at) > new Date(thread.updated_at ?? thread.created_at)) {
        unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1);
      }
    }
  }

  const enriched = threads.map((t) => {
    const profile = profileById.get(t.user_id);
    const last = lastMessageByThread.get(t.id);
    return {
      ...t,
      user_email: profile?.email ?? '—',
      user_full_name: profile?.full_name ?? null,
      last_message_body: last?.body ?? null,
      last_message_role: last?.sender_role ?? null,
      last_message_at: last?.created_at ?? t.last_message_at,
      unread_count: unreadByThread.get(t.id) ?? 0,
    };
  });

  // Re-sort by last_message_at after enrichment
  enriched.sort(
    (a, b) =>
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime()
  );

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto">
      <header className="mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Sipò
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Konvèsasyon avèk <em className="text-forest-600 not-italic font-bold">manm yo</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Tout chat sipò an direk. Chwazi yon konvèsasyon pou reponn. Lè ou
          voye yon mesaj, manm nan resevwa l imedyatman epi yon notifikasyon
          ap parèt nan kloch li.
        </p>
      </header>

      <SupportInbox initialThreads={enriched} adminPersona={adminPersona} />
    </div>
  );
}
