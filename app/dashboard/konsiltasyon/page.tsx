import Link from 'next/link';
import {
  Stethoscope,
  Crown,
  ArrowUpRight,
  Video,
  Phone,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import SlotPicker, { type Slot } from './slot-picker';
import BookingStatusCard from './booking-status-card';

export const metadata = { title: 'Konsiltasyon · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const SLOT_COLS = 'id, starts_at, duration_minutes, modality, consultant_name';

type BookingRow = {
  id: string;
  status: string;
  topic: string | null;
  note: string | null;
  meeting_url: string | null;
  consultant_name: string | null;
  slot_id: string;
  proposed_slot_id: string | null;
};

export default async function KonsiltasyonPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('plan, full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  const plan = profile?.plan ?? 'basic';
  const isMelis = plan === 'vip';
  const shortName = (
    profile?.full_name ||
    profile?.email.split('@')[0] ||
    'Manm'
  ).split(' ')[0];

  let slots: Slot[] = [];
  let booking: BookingRow | null = null;
  let agreedSlot: Slot | null = null;
  let proposedSlot: Slot | null = null;

  if (isMelis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const nowIso = new Date().toISOString();
    const [{ data: slotRows }, { data: bookingRows }] = await Promise.all([
      sb
        .from('consultation_slots')
        .select(SLOT_COLS)
        .eq('status', 'open')
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(60),
      sb
        .from('consultation_bookings')
        .select(
          'id, status, topic, note, meeting_url, consultant_name, slot_id, proposed_slot_id'
        )
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed', 'reschedule_proposed'])
        .order('created_at', { ascending: false })
        .limit(1),
    ]);
    slots = (slotRows ?? []) as Slot[];
    booking = (((bookingRows ?? [])[0] as BookingRow | undefined) ?? null);

    if (booking) {
      const ids = [booking.slot_id, booking.proposed_slot_id].filter(
        Boolean
      ) as string[];
      const { data: bslots } = await sb
        .from('consultation_slots')
        .select(SLOT_COLS)
        .in('id', ids);
      const map = new Map<string, Slot>();
      for (const s of (bslots ?? []) as Slot[]) map.set(s.id, s);
      agreedSlot = map.get(booking.slot_id) ?? null;
      proposedSlot = booking.proposed_slot_id
        ? map.get(booking.proposed_slot_id) ?? null
        : null;
    }
  }

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={PLAN_LABEL[plan]}
        userId={user.id}
        userPlan={plan}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
            <Stethoscope className="w-3.5 h-3.5" strokeWidth={2.2} />
            Konsiltasyon patikilye
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Konsiltasyon
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            {isMelis
              ? 'Rezève yon kreno ak yon gid Hoïs — gratis, enkli nan plan Melis ou.'
              : 'Konsiltasyon patikilye sou ka maladi mistik — yon avantaj rezève pou manm Hoïs Melis.'}
          </p>
        </header>

        {isMelis ? (
          booking ? (
            <BookingStatusCard
              booking={booking}
              slot={agreedSlot}
              proposedSlot={proposedSlot}
            />
          ) : (
            <SlotPicker slots={slots} />
          )
        ) : (
          /* Non-Melis — polished upgrade-to-Melis state */
          <section className="relative overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-card">
            <div className="relative overflow-hidden bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-6 md:p-8">
              <div
                className="absolute -top-16 -right-12 w-72 h-72 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden
              />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200 mb-3">
                  <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Hoïs Melis
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  Konsiltasyon patikilye yo rezève pou Melis.
                </h2>
                <p className="mt-2 text-sm md:text-[15px] text-cream-200/90 max-w-2xl leading-relaxed">
                  Pase sou plan Hoïs Melis pou w ka rezève yon konsiltasyon
                  patikilye sou ka maladi mistik — dirèkteman nan tablodebò w,
                  gratis nan plan an.
                </p>
              </div>
            </div>

            <div className="p-5 md:p-7">
              <ul className="grid gap-2.5 mb-6">
                {[
                  { icon: Video, text: 'Chwazi yon kreno sou videyo, telefòn oswa an pèsòn' },
                  { icon: ShieldCheck, text: 'Nou verifye epi konfime chak randevou ak ou' },
                  { icon: Users, text: 'Yon echanj dirèk ak yon gid Hoïs sou ka ou' },
                ].map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 grid place-items-center w-6 h-6 rounded-lg bg-gold-100 text-gold-700 shrink-0">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="text-sm text-ink/90 leading-relaxed">
                        {b.text}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/checkout?plan=vip&cycle=yearly"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold-400 hover:bg-gold-300 text-forest-900 font-bold text-sm shadow-sm transition"
                >
                  Pase sou Melis
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
                </Link>
                <Link
                  href="/dashboard/vip"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-cream-200 hover:border-gold-300 text-ink font-semibold text-sm transition"
                >
                  Dekouvri Melis
                </Link>
              </div>
            </div>
          </section>
        )}

        <p className="flex items-center gap-1.5 text-[11px] text-earth-400 mt-1">
          <Phone className="w-3 h-3" strokeWidth={2.2} />
          Tout konsiltasyon rete konfidansyèl ant ou menm ak ekip Hoïs la.
        </p>
      </div>
    </>
  );
}
