import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Inbox,
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Archive as ArchiveIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ContactReplyForm from './reply-form';
import ContactRowActions from './row-actions';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

export const metadata = { title: 'Admin · Detay mesaj' };
export const dynamic = 'force-dynamic';

type ContactRow = Database['public']['Tables']['contact_messages']['Row'];
type ProfileRow = {
  full_name: string | null;
  first_name: string | null;
  email: string;
};

const TOPIC_LABEL: Record<string, string> = {
  general: 'Jeneral',
  support: 'Sipò',
  partnership: 'Patnèsip',
  press: 'Près',
  plant: 'Plant',
};
const TOPIC_TONE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700',
  support: 'bg-rose-100 text-rose-700',
  partnership: 'bg-violet-100 text-violet-700',
  press: 'bg-amber-100 text-amber-700',
  plant: 'bg-forest-100 text-forest-700',
};

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()} · ${hh}h${mm}`;
}

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_contact')) {
    redirect('/admin');
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (error || !data) notFound();
  const row = data as ContactRow;

  // If the contact was a logged-in member, attach their profile for context.
  let memberProfile: ProfileRow | null = null;
  let respondedByName: string | null = null;
  if (row.user_id) {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, first_name, email')
      .eq('id', row.user_id)
      .maybeSingle();
    memberProfile = (p as ProfileRow | null) ?? null;
  }
  if (row.responded_by) {
    const { data: r } = await supabase
      .from('profiles')
      .select('full_name, first_name, email')
      .eq('id', row.responded_by)
      .maybeSingle();
    const rp = r as ProfileRow | null;
    respondedByName =
      rp?.full_name || rp?.first_name || rp?.email || row.responded_by;
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <Link
        href="/admin/contact"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 transition mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
        Tounen nan inbox la
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Inbox className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Detay mesaj
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink flex-1 min-w-0">
            {row.subject}
          </h1>
          <StatusBadge status={row.status} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 md:gap-8">
        {/* Main column: message + reply */}
        <div className="space-y-6">
          {/* Original message */}
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <header className="flex items-start gap-3 mb-4">
              <div
                className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-sm"
                aria-hidden
              >
                {(row.full_name[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base font-bold text-ink truncate">
                  {row.full_name}
                </div>
                <div className="text-xs text-earth-600 font-mono truncate">
                  {row.email}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-earth-500">
                  <Calendar className="w-3 h-3" strokeWidth={2.4} />
                  {formatDateTime(row.created_at)}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                  TOPIC_TONE[row.topic] ?? TOPIC_TONE.general
                }`}
              >
                {TOPIC_LABEL[row.topic] ?? row.topic}
              </span>
            </header>

            <p className="text-sm md:text-base text-ink leading-relaxed whitespace-pre-wrap">
              {row.message}
            </p>
          </section>

          {/* Previous response (if any) */}
          {row.response_body && (
            <section className="bg-forest-50/50 border border-forest-200 rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-forest-800 font-bold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                Repons admin lan
                {respondedByName && (
                  <span className="text-earth-500 normal-case tracking-normal font-medium">
                    · {respondedByName}
                  </span>
                )}
                {row.responded_at && (
                  <span className="text-earth-500 normal-case tracking-normal font-medium">
                    · {formatDateTime(row.responded_at)}
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base text-ink leading-relaxed whitespace-pre-wrap">
                {row.response_body}
              </p>
            </section>
          )}

          {/* Reply form (always available — admin may want to re-respond) */}
          <ContactReplyForm
            id={row.id}
            toName={row.full_name}
            toEmail={row.email}
            previousResponse={row.response_body}
          />
        </div>

        {/* Side column: metadata + actions */}
        <aside className="space-y-4">
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-3">
              Detay kontak la
            </h3>
            <dl className="space-y-2.5 text-sm">
              <DL
                icon={<UserIcon className="w-3.5 h-3.5" strokeWidth={2.4} />}
                label="Non"
                value={row.full_name}
              />
              <DL
                icon={<Mail className="w-3.5 h-3.5" strokeWidth={2.4} />}
                label="Imèl"
                value={
                  <a
                    href={`mailto:${row.email}`}
                    className="text-forest-700 hover:underline break-all"
                  >
                    {row.email}
                  </a>
                }
              />
              {row.phone && (
                <DL
                  icon={<Phone className="w-3.5 h-3.5" strokeWidth={2.4} />}
                  label="Telefòn"
                  value={
                    <a
                      href={`tel:${row.phone}`}
                      className="text-forest-700 hover:underline"
                    >
                      {row.phone}
                    </a>
                  }
                />
              )}
              <DL
                icon={<Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />}
                label="Resevwa"
                value={formatDateTime(row.created_at)}
              />
            </dl>

            {memberProfile && (
              <div className="mt-4 pt-4 border-t border-cream-100">
                <div className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold mb-1">
                  Manm konekte
                </div>
                <div className="text-xs text-earth-700">
                  {memberProfile.full_name ?? memberProfile.email}
                </div>
                {row.user_id && (
                  <Link
                    href={`/admin/users/${row.user_id}`}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900 transition"
                  >
                    Wè pwofil
                  </Link>
                )}
              </div>
            )}
          </div>

          <ContactRowActions id={row.id} status={row.status} />
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ContactRow['status'] }) {
  if (status === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Nouvo
      </span>
    );
  }
  if (status === 'responded') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-forest-100 text-forest-700">
        <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
        Reponn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-cream-200 text-earth-700">
      <ArchiveIcon className="w-3 h-3" strokeWidth={2.4} />
      Achive
    </span>
  );
}

function DL({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-0.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}
