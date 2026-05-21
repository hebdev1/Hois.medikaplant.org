import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Droplet,
  Heart,
  Activity,
  Scale,
  Pill,
  Leaf,
  Eye,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Ruler,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import HealthLineChart from '@/components/dashboard/health-line-chart';
import { cn } from '@/lib/utils';
import PrescriptionForm from './prescription-form';
import TreatmentActions from './treatment-actions';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Pasyan' };
export const dynamic = 'force-dynamic';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Medical = Database['public']['Tables']['user_medical_info']['Row'];
type Prefs = Database['public']['Tables']['user_preferences']['Row'];
type Log = Database['public']['Tables']['health_logs']['Row'];
type Treatment = Database['public']['Tables']['treatment_recommendations']['Row'];

const CONDITION_LABEL: Record<string, string> = {
  diabetes_type_1: 'Dyabèt Tip 1',
  diabetes_type_2: 'Dyabèt Tip 2',
  hypertension: 'Tansyon wo',
  hypotension: 'Tansyon ba',
  asthma: 'Opresyon',
  arthritis: 'Atrit',
  cholesterol: 'Kolestewòl wo',
  anemia: 'Anemi',
  thyroid: 'Tirowid',
  kidney: 'Ren',
  liver: 'Fwa',
  gastric: 'Dijesyon',
  migraine: 'Migrèn',
  depression: 'Depresyon',
  anxiety: 'Anksyete',
  insomnia: 'Pwoblèm somèy',
};

const KIND_META: Record<
  string,
  { label: string; icon: typeof Pill; tone: string }
> = {
  medication: { label: 'Medikaman', icon: Pill, tone: 'bg-indigo-100 text-indigo-700' },
  herbal: { label: 'Tizan / Plant', icon: Leaf, tone: 'bg-forest-100 text-forest-700' },
  lifestyle: { label: 'Abitid', icon: Activity, tone: 'bg-amber-100 text-amber-700' },
  monitoring: { label: 'Swivi', icon: Eye, tone: 'bg-sky-100 text-sky-700' },
  referral: { label: 'Referans', icon: ArrowRight, tone: 'bg-rose-100 text-rose-700' },
};

const MOIS = [
  'Janvye',
  'Fevriye',
  'Mas',
  'Avril',
  'Me',
  'Jen',
  'Jiyè',
  'Out',
  'Septanm',
  'Oktòb',
  'Novanm',
  'Desanm',
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

export default async function AdminPatientPage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();

  const [profileResult, medicalResult, prefsResult, logsResult, treatmentsResult, subsResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', params.userId).maybeSingle(),
      supabase
        .from('user_medical_info')
        .select('*')
        .eq('user_id', params.userId)
        .maybeSingle(),
      supabase
        .from('user_preferences')
        .select(
          'target_blood_sugar_min, target_blood_sugar_max, target_weight_kg, share_progress_with_coach'
        )
        .eq('user_id', params.userId)
        .maybeSingle(),
      supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', params.userId)
        .gte('logged_at', new Date(Date.now() - 90 * 86400000).toISOString())
        .order('logged_at', { ascending: true }),
      supabase
        .from('treatment_recommendations')
        .select('*')
        .eq('user_id', params.userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('subscriptions')
        .select('plan, status, start_date, end_date')
        .eq('user_id', params.userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileResult.data as ProfileRow | null;
  if (!profile) notFound();

  const medical = medicalResult.data as Medical | null;
  const prefs = prefsResult.data as Pick<
    Prefs,
    | 'target_blood_sugar_min'
    | 'target_blood_sugar_max'
    | 'target_weight_kg'
    | 'share_progress_with_coach'
  > | null;
  const logs = (logsResult.data ?? []) as Log[];
  const treatments = (treatmentsResult.data ?? []) as Treatment[];
  const sub = subsResult.data as { plan: string; status: string } | null;

  const conditions = (medical?.conditions ?? []).filter(Boolean);
  const age = calcAge(profile.date_of_birth);
  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const initials = (
    profile.first_name?.[0] ??
    profile.email?.[0] ??
    'M'
  ).toUpperCase();

  // Build per-metric chart series
  const bsPoints = logs
    .filter((l) => l.blood_sugar != null)
    .map((l) => ({ loggedAt: l.logged_at, value: l.blood_sugar as number }));
  const wtPoints = logs
    .filter((l) => l.weight != null)
    .map((l) => ({ loggedAt: l.logged_at, value: l.weight as number }));
  const sysPoints = logs
    .filter((l) => l.blood_pressure_systolic != null)
    .map((l) => ({
      loggedAt: l.logged_at,
      value: l.blood_pressure_systolic as number,
    }));

  const bsTarget = prefs
    ? { min: prefs.target_blood_sugar_min, max: prefs.target_blood_sugar_max }
    : { min: 70, max: 130 };
  const wtTarget = prefs?.target_weight_kg
    ? {
        min: Math.round((prefs.target_weight_kg - 3) * 10) / 10,
        max: Math.round((prefs.target_weight_kg + 3) * 10) / 10,
      }
    : { min: 60, max: 75 };

  const activeTreatments = treatments.filter((t) => t.status === 'active');
  const pastTreatments = treatments.filter((t) => t.status !== 'active');

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <Link
        href="/admin/health"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan lis pasyan yo
      </Link>

      {/* Patient header */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-2xl shrink-0 shadow-plant">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
              {fullName}
            </h1>
            <div className="mt-1 text-sm text-earth-600 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                  {profile.phone}
                </span>
              )}
              {age !== null && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5" strokeWidth={2} />
                  {age} ane
                </span>
              )}
              {(profile.city || profile.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                Manm depi {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full bg-forest-100 text-forest-700">
              Plan {profile.plan}
            </span>
            {sub && (
              <div className="text-[11px] text-earth-500 mt-1">
                Aktif
              </div>
            )}
          </div>
        </div>

        {/* Conditions strip */}
        {conditions.length > 0 && (
          <div className="mt-5 pt-5 border-t border-cream-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-2">
              Kondisyon medikal
            </div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-100 text-earth-700 border border-cream-200 text-xs font-semibold"
                >
                  {CONDITION_LABEL[c] ?? c.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick clinical snapshot */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoBox
            icon={Heart}
            label="Tip san"
            value={medical?.blood_type ?? '—'}
          />
          <InfoBox
            icon={Ruler}
            label="Wotè"
            value={medical?.height_cm ? `${medical.height_cm} cm` : '—'}
          />
          <InfoBox
            icon={User}
            label="Sèks"
            value={profile.gender ? formatGender(profile.gender) : '—'}
          />
          <InfoBox
            icon={Activity}
            label="Mezi (30 jou)"
            value={`${logs.length}`}
          />
        </div>

        {!prefs?.share_progress_with_coach && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.2} />
            <span>
              Pasyan an pa eksplisit pèmèt &ldquo;Pataje pwogrè ak antrenè m&rdquo; nan
              Konfidansyalite paramèt yo. Itilize done sa yo ak prekosyon —
              admin gen aksè teknik atravè RLS, men respè pasyan an enpòtan.
            </span>
          </div>
        )}
      </section>

      {/* Medical detail + clinical contacts */}
      <section className="grid md:grid-cols-2 gap-5 md:gap-6 mb-6">
        <ClinicalCard title="Kondisyon ak medikaman aktyèl">
          <DetailLine
            label="Alèji"
            value={medical?.allergies}
            emptyText="Pa gen alèji ki anrejistre"
          />
          <DetailLine
            label="Medikaman aktyèl"
            value={medical?.medications}
          />
          <DetailLine
            label="Maladi kwonik"
            value={medical?.chronic_diseases}
          />
          <DetailLine
            label="Operasyon pase yo"
            value={medical?.past_surgeries}
          />
          <DetailLine
            label="Objektif sante"
            value={
              medical?.health_goal
                ? medical.health_goal.replace(/_/g, ' ')
                : null
            }
          />
        </ClinicalCard>

        <ClinicalCard title="Kontak klinik ak ijans">
          <DetailLine label="Doktè trete" value={medical?.doctor_name} />
          <DetailLine label="Telefòn doktè" value={medical?.doctor_phone} />
          <DetailLine
            label="Famasi prefere"
            value={medical?.preferred_pharmacy}
          />
          <DetailLine
            label="Kontak ijans"
            value={
              profile.emergency_contact_name && profile.emergency_contact_phone
                ? `${profile.emergency_contact_name} · ${profile.emergency_contact_phone}`
                : profile.emergency_contact_name ?? profile.emergency_contact_phone
            }
          />
          <DetailLine label="Adrès" value={
            [profile.address_line1, profile.address_line2, profile.city, profile.region, profile.postal_code, profile.country]
              .filter(Boolean)
              .join(', ') || null
          } />
          {medical?.notes && (
            <div className="pt-3 border-t border-cream-200/60 mt-3">
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
                Lòt nòt klinik
              </div>
              <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">
                {medical.notes}
              </p>
            </div>
          )}
        </ClinicalCard>
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-2 gap-5 md:gap-6 mb-6">
        <ChartCard
          title="Sik nan san"
          unit="mg/dL"
          target={bsTarget}
          points={bsPoints}
          icon={Droplet}
          accent="#5A9138"
        />
        <ChartCard
          title="Pwa kò"
          unit="kg"
          target={wtTarget}
          points={wtPoints}
          icon={Scale}
          accent="#C9A227"
        />
        <ChartCard
          title="Tansyon sistolik"
          unit="mmHg"
          target={{ min: 100, max: 130 }}
          points={sysPoints}
          icon={Activity}
          accent="#B73A3A"
        />

        {/* Prescription form */}
        <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
          <header className="mb-4">
            <h2 className="font-display text-lg font-bold text-ink">
              Pwopoze yon <em className="text-forest-600 not-italic font-bold">tretman</em>
            </h2>
            <p className="text-xs text-earth-600 mt-0.5">
              Sa pasyan an pral wè dirèkteman sou paj Swivi Sante li yo.
            </p>
          </header>
          <PrescriptionForm
            userId={params.userId}
            conditions={conditions}
          />
        </section>
      </section>

      {/* Treatment history */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Istwa tretman <em className="text-forest-600 not-italic font-bold">pasyan an</em>
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
            {activeTreatments.length} aktif · {treatments.length} total
          </span>
        </header>

        {treatments.length === 0 ? (
          <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center text-sm text-earth-600">
            Pasyan an pa janm resevwa yon pwopozisyon. Itilize fòm anwo a pou
            kòmanse.
          </div>
        ) : (
          <ul className="space-y-3">
            {[...activeTreatments, ...pastTreatments].map((t) => (
              <TreatmentRow key={t.id} treatment={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatGender(g: string): string {
  if (g === 'male') return 'Gason';
  if (g === 'female') return 'Fi';
  if (g === 'other') return 'Lòt';
  return 'Pa di';
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-cream-50 border border-cream-200 p-3 flex items-center gap-3">
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-white text-forest-700">
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
          {label}
        </div>
        <div className="text-sm font-semibold text-ink">{value}</div>
      </div>
    </div>
  );
}

function ClinicalCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <h3 className="font-display text-base font-bold text-ink mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DetailLine({
  label,
  value,
  emptyText = '—',
}: {
  label: string;
  value: string | null | undefined;
  emptyText?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
        {label}
      </div>
      <div className="text-sm text-ink/90 mt-0.5 whitespace-pre-wrap leading-relaxed">
        {value && value.trim().length > 0 ? value : (
          <span className="italic text-earth-400">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  unit,
  target,
  points,
  icon: Icon,
  accent,
}: {
  title: string;
  unit: string;
  target: { min: number; max: number };
  points: { loggedAt: string; value: number }[];
  icon: typeof Droplet;
  accent: string;
}) {
  const latest = points.length > 0 ? points[points.length - 1].value : null;
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
            style={{ background: `${accent}22`, color: accent }}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-ink leading-tight">
              {title}
            </h2>
            <p className="text-[11px] text-earth-500 mt-0.5">
              {points.length} mezi · sib {target.min}–{target.max} {unit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ink leading-none">
            {latest !== null ? latest : '—'}
          </div>
          <div className="text-[10px] text-earth-500 mt-0.5">{unit}</div>
        </div>
      </header>
      <HealthLineChart
        points={points}
        targetMin={target.min}
        targetMax={target.max}
        unit={unit}
        rangeDays={90}
      />
    </section>
  );
}

function TreatmentRow({ treatment: t }: { treatment: Treatment }) {
  const meta = KIND_META[t.kind] ?? KIND_META.monitoring;
  const Icon = meta.icon;
  const isCancelled = t.status === 'cancelled';
  const isCompleted = t.status === 'completed';

  return (
    <li
      className={cn(
        'grid grid-cols-[auto_1fr_auto] gap-3 items-start p-3 rounded-xl border',
        t.status === 'active'
          ? 'bg-cream-50 border-cream-200'
          : 'bg-cream-50/40 border-cream-200/60 opacity-80'
      )}
    >
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', meta.tone)}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink truncate">
            {t.title}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-700 border border-cream-200 text-[9px] font-bold uppercase tracking-wide">
            {meta.label}
          </span>
          {isCancelled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wide">
              Anile
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700 text-[9px] font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
              Konplete
            </span>
          )}
          {t.read_at && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100 text-[9px] font-bold uppercase tracking-wide">
              <Eye className="w-2.5 h-2.5" strokeWidth={2.4} />
              Li
            </span>
          )}
        </div>
        <p className="text-xs text-earth-700 leading-relaxed mt-1 line-clamp-2 whitespace-pre-wrap">
          {t.description}
        </p>
        <div className="text-[11px] text-earth-500 mt-1 flex items-center gap-2 flex-wrap">
          <span>Voye {formatDate(t.created_at)}</span>
          {t.dose && (
            <>
              <span aria-hidden>·</span>
              <span>Dòz: {t.dose}</span>
            </>
          )}
          {t.frequency && (
            <>
              <span aria-hidden>·</span>
              <span>{t.frequency}</span>
            </>
          )}
          {t.duration && (
            <>
              <span aria-hidden>·</span>
              <span>{t.duration}</span>
            </>
          )}
        </div>
      </div>
      <TreatmentActions
        treatmentId={t.id}
        status={t.status as 'active' | 'completed' | 'cancelled'}
      />
    </li>
  );
}
