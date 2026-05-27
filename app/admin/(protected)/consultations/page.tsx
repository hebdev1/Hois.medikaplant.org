import { CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ConsultationsBoard, { type EnrichedConsultation } from './consultations-board';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Konsiltasyon' };
export const dynamic = 'force-dynamic';

type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

export default async function AdminConsultationsPage() {
  const supabase = createClient();

  // Pull every consultation regardless of status; the board groups them
  // into "Demann ann atant", "Pwograme", and "Pase / fini" tabs.
  const { data: rowsRaw } = await supabase
    .from('consultations')
    .select('*')
    .order('created_at', { ascending: false });
  const rows = (rowsRaw ?? []) as ConsultationRow[];

  // Fan out profile fetches so the board can show name + email of each
  // requester without N round-trips client-side.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const profiles = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name, plan, phone')
        .in('id', userIds)
    : { data: [], error: null };

  const profileById = new Map<
    string,
    {
      id: string;
      email: string;
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      plan: string;
      phone: string | null;
    }
  >();
  for (const p of (profiles.data ?? []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    plan: string;
    phone: string | null;
  }>) {
    profileById.set(p.id, p);
  }

  const enriched: EnrichedConsultation[] = rows.map((r) => {
    const p = profileById.get(r.user_id);
    return {
      ...r,
      user_email: p?.email ?? '—',
      user_full_name:
        p?.full_name ||
        [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() ||
        null,
      user_plan: (p?.plan ?? 'basic') as 'basic' | 'premium' | 'vip',
      user_phone: p?.phone ?? null,
    };
  });

  const counts = {
    requested: enriched.filter((c) => c.status === 'requested').length,
    scheduled: enriched.filter((c) => c.status === 'scheduled').length,
    closed: enriched.filter(
      (c) => c.status === 'completed' || c.status === 'cancelled' || c.status === 'no_show'
    ).length,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <CalendarClock className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Konsiltasyon
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Demann konsiltasyon
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Manm yo voye demann ki rive isit la. Pwograme dat + èdtan an, asiyen
          yon konsiltan, oswa anile yon demann. Manm nan ap resevwa yon
          notifikasyon otomatikman lè ou pwograme konsiltasyon an.
        </p>
      </header>

      <ConsultationsBoard initial={enriched} counts={counts} />
    </div>
  );
}
