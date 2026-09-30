import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarRange, User, Clock, CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import AvailabilityManager from './availability-manager';
import BookingRow from './booking-row';

export const metadata = { title: 'Admin · Konsiltasyon' };
export const dynamic = 'force-dynamic';

const TZ = 'America/Port-au-Prince';
const SLOT_COLS = 'id, starts_at, duration_minutes, modality, consultant_name, status';

type SlotRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  modality: 'video' | 'phone' | 'in_person';
  consultant_name: string | null;
  status: 'open' | 'booked' | 'blocked' | string;
};

type BookingRecord = {
  id: string;
  user_id: string;
  status: string;
  topic: string | null;
  note: string | null;
  meeting_url: string | null;
  consultant_name: string | null;
  admin_note: string | null;
  slot_id: string;
  proposed_slot_id: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ann atant',
  confirmed: 'Konfime',
  reschedule_proposed: 'Repwograme',
  declined: 'Manm refize',
  cancelled: 'Anile',
  completed: 'Fèt',
  no_show: 'Pa vini',
};
const STATUS_TONE: Record<string, string> = {
  pending: 'bg-gold-100 text-gold-700',
  confirmed: 'bg-forest-100 text-forest-800',
  reschedule_proposed: 'bg-gold-200 text-gold-800',
  declined: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-slate-200 text-slate-700',
  completed: 'bg-forest-200 text-forest-900',
  no_show: 'bg-slate-200 text-slate-700',
};
const FILTERS = ['pending', 'reschedule_proposed', 'confirmed', 'completed'] as const;

function fmtFull(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default async function AdminKonsiltasyonPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_subscriptions')) {
    redirect('/admin');
  }

  const filterStatus = searchParams.status ?? 'all';
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Upcoming slots (all statuses) for the availability list; open ones feed the
  // reschedule selects. Bookings (optionally filtered) for the triage list.
  const [{ data: slotRows }, { data: bookingRowsRaw }] = await Promise.all([
    sb
      .from('consultation_slots')
      .select(SLOT_COLS)
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(200),
    (() => {
      let q = sb
        .from('consultation_bookings')
        .select(
          'id, user_id, status, topic, note, meeting_url, consultant_name, admin_note, slot_id, proposed_slot_id, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (filterStatus !== 'all' && filterStatus in STATUS_LABEL) {
        q = q.eq('status', filterStatus);
      }
      return q;
    })(),
  ]);

  const slots = (slotRows ?? []) as SlotRow[];
  const openSlots = slots.filter((s) => s.status === 'open');
  const bookings = (bookingRowsRaw ?? []) as BookingRecord[];

  // Resolve slot rows referenced by bookings (agreed + proposed) in one query.
  const refIds = Array.from(
    new Set(
      bookings.flatMap((b) =>
        [b.slot_id, b.proposed_slot_id].filter(Boolean) as string[]
      )
    )
  );
  const slotById = new Map<string, SlotRow>();
  for (const s of slots) slotById.set(s.id, s);
  const missing = refIds.filter((id) => !slotById.has(id));
  if (missing.length > 0) {
    const { data: extra } = await sb
      .from('consultation_slots')
      .select(SLOT_COLS)
      .in('id', missing);
    for (const s of (extra ?? []) as SlotRow[]) slotById.set(s.id, s);
  }

  // Member display names in one query.
  const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));
  const namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of (profs ?? []) as Array<{
      id: string;
      full_name: string | null;
      email: string;
    }>) {
      namesById.set(p.id, p.full_name || p.email.split('@')[0]);
    }
  }

  // Counts for the filter pills (from the currently-loaded list when unfiltered).
  const counts: Record<string, number> = { all: bookings.length };
  for (const f of FILTERS) counts[f] = bookings.filter((b) => b.status === f).length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
          <CalendarRange className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Konsiltasyon (Melis)
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Konsiltasyon patikilye
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Pibliye kreno disponib yo, epi jere demann manm Melis yo: konfime,
          repwograme (manm nan dwe aksepte), oswa fèmen.
        </p>
      </header>

      <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,340px)_1fr] items-start">
        {/* Availability */}
        <AvailabilityManager slots={slots} />

        {/* Bookings triage */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-1 p-1 bg-cream-100 border border-cream-200 rounded-2xl">
            <FilterPill href="/admin/konsiltasyon" active={filterStatus === 'all'}>
              Tout ({counts.all})
            </FilterPill>
            {FILTERS.map((s) => (
              <FilterPill
                key={s}
                href={`/admin/konsiltasyon?status=${s}`}
                active={filterStatus === s}
              >
                {STATUS_LABEL[s]} ({counts[s]})
              </FilterPill>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center text-sm text-earth-600">
              Pa gen demann nan filtre sa a pou kounye a.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const memberName = namesById.get(b.user_id) ?? 'Manm';
                const agreed = slotById.get(b.slot_id) ?? null;
                const proposed = b.proposed_slot_id
                  ? slotById.get(b.proposed_slot_id) ?? null
                  : null;
                return (
                  <article
                    key={b.id}
                    className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card"
                  >
                    <header className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_TONE[b.status] ?? 'bg-cream-100 text-earth-700'
                          }`}
                        >
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-earth-600">
                          <User className="w-3 h-3" strokeWidth={2.2} />
                          {memberName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-earth-500">
                          <Clock className="w-3 h-3" strokeWidth={2.2} />
                          {new Date(b.created_at).toLocaleString('fr-FR', {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </header>

                    {/* Agreed / proposed slot times */}
                    <div className="mb-2 space-y-1 text-[13px]">
                      {agreed && (
                        <p className="inline-flex items-center gap-1.5 text-ink">
                          <CalendarClock className="w-3.5 h-3.5 text-forest-700" strokeWidth={2.2} />
                          <span className="capitalize">{fmtFull(agreed.starts_at)}</span>
                        </p>
                      )}
                      {proposed && (
                        <p className="text-[12px] text-gold-700">
                          Lè pwopoze:{' '}
                          <span className="capitalize font-semibold">
                            {fmtFull(proposed.starts_at)}
                          </span>
                        </p>
                      )}
                    </div>

                    {b.topic && (
                      <p className="text-sm font-semibold text-ink leading-relaxed">
                        {b.topic}
                      </p>
                    )}
                    {b.note && (
                      <p className="text-sm text-earth-700 leading-relaxed whitespace-pre-wrap mt-0.5">
                        {b.note}
                      </p>
                    )}

                    <BookingRow
                      booking={{
                        id: b.id,
                        status: b.status,
                        meetingUrl: b.meeting_url,
                        consultantName: b.consultant_name,
                        adminNote: b.admin_note,
                      }}
                      openSlots={openSlots.map((s) => ({
                        id: s.id,
                        starts_at: s.starts_at,
                        modality: s.modality,
                      }))}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
        active
          ? 'bg-white text-forest-800 shadow-sm'
          : 'text-earth-700 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
