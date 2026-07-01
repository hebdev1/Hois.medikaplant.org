import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FolderKanban,
  PlusCircle,
  Eye,
  EyeOff,
  Shield,
  Users as UsersIcon,
  CalendarRange,
  Copy,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import { describeCondition } from '@/lib/conditions/catalog';
import ProgramRowActions from './program-row-actions';
import type { Database } from '@/types/database';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

export const metadata = { title: 'Admin · Pwogram' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700 border-slate-200',
  premium: 'bg-teal-100 text-teal-700 border-teal-200',
  vip: 'bg-amber-100 text-amber-800 border-amber-200',
};

const LEVEL_LABEL: Record<string, string> = {
  debutan: 'Debutan',
  entermedye: 'Entèmedyè',
  avanse: 'Avanse',
  tout_nivo: 'Tout nivo',
};

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: { filter?: 'active' | 'inactive' | 'all' };
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
  if (!hasCapability(adminRole, 'manage_programs')) {
    redirect('/admin');
  }

  const filter = searchParams.filter ?? 'all';

  const [programsRes, tasksRes, enrollsRes] = await Promise.all([
    supabase.from('programs').select('*').order('plan_required', { ascending: true }).order('name', { ascending: true }),
    supabase.from('program_tasks').select('program_id, day_number'),
    supabase.from('user_programs').select('program_id, is_active'),
  ]);

  const allPrograms = (programsRes.data ?? []) as ProgramRow[];
  const programs = allPrograms.filter((p) => {
    if (filter === 'active') return p.active;
    if (filter === 'inactive') return !p.active;
    return true;
  });

  const taskCount = new Map<string, number>();
  const daysFilled = new Map<string, Set<number>>();
  for (const r of (tasksRes.data ?? []) as Array<{
    program_id: string;
    day_number: number | null;
  }>) {
    taskCount.set(r.program_id, (taskCount.get(r.program_id) ?? 0) + 1);
    if (r.day_number) {
      let s = daysFilled.get(r.program_id);
      if (!s) {
        s = new Set<number>();
        daysFilled.set(r.program_id, s);
      }
      s.add(r.day_number);
    }
  }

  const enrolledCount = new Map<string, number>();
  const totalEnrolls = new Map<string, number>();
  for (const r of (enrollsRes.data ?? []) as Array<{
    program_id: string;
    is_active: boolean;
  }>) {
    totalEnrolls.set(r.program_id, (totalEnrolls.get(r.program_id) ?? 0) + 1);
    if (r.is_active) {
      enrolledCount.set(
        r.program_id,
        (enrolledCount.get(r.program_id) ?? 0) + 1
      );
    }
  }

  const totalActive = allPrograms.filter((p) => p.active).length;
  const totalInactive = allPrograms.length - totalActive;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-3">
            <FolderKanban className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Pwogram
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Jere tout pwogram Hoïs yo
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Kreye, modifye, dezaktive oswa bloke pwogram yo pou yon plan
            espesifik. Chak pwogram gen tach jou pa jou nan tab kalandriye a.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-xl transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" strokeWidth={2.4} />
          Nouvo pwogram
        </Link>
      </header>

      {/* ── Filter pills ─────────────────────────────────────────────── */}
      <div className="mb-5 inline-flex p-1 bg-cream-100 border border-cream-200 rounded-2xl">
        <FilterPill href="/admin/programs?filter=all" active={filter === 'all'}>
          Tout ({allPrograms.length})
        </FilterPill>
        <FilterPill href="/admin/programs?filter=active" active={filter === 'active'}>
          Aktif ({totalActive})
        </FilterPill>
        <FilterPill
          href="/admin/programs?filter=inactive"
          active={filter === 'inactive'}
        >
          Enaktif ({totalInactive})
        </FilterPill>
      </div>

      {/* ── Program cards ────────────────────────────────────────────── */}
      {programs.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center text-sm text-earth-600">
          Pa gen okenn pwogram nan filtre sa a.{' '}
          <Link href="/admin/programs/new" className="text-forest-700 font-semibold underline">
            Kreye premye pwogram nan
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-3">
          {programs.map((p) => {
            const nTasks = taskCount.get(p.id) ?? 0;
            const nDays = daysFilled.get(p.id)?.size ?? 0;
            const enrolled = enrolledCount.get(p.id) ?? 0;
            const totalEver = totalEnrolls.get(p.id) ?? 0;
            const tags = (p.condition_tags ?? [])
              .slice(0, 4)
              .map((slug) => describeCondition(slug));
            const extraTags = Math.max(
              0,
              (p.condition_tags ?? []).length - tags.length
            );

            return (
              <article
                key={p.id}
                className="grid sm:grid-cols-[6px_1fr_auto] gap-4 bg-white border border-cream-200 rounded-2xl overflow-hidden hover:border-forest-300 transition"
              >
                {/* Left accent bar tinted by the program's own accent color */}
                <div
                  className="w-full sm:w-1.5 h-1.5 sm:h-full"
                  style={{ backgroundColor: p.accent_color }}
                  aria-hidden
                />

                <div className="p-4 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <Link
                      href={`/admin/programs/${p.id}`}
                      className="font-display text-base font-bold text-ink hover:text-forest-700 truncate"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        PLAN_TONE[p.plan_required] ?? PLAN_TONE.basic
                      }`}
                      title={`Aksè min: ${PLAN_LABEL[p.plan_required]}`}
                    >
                      <Shield className="inline w-2.5 h-2.5 mr-0.5" strokeWidth={2.4} />
                      {PLAN_LABEL[p.plan_required]}+
                    </span>
                    {!p.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-earth-700">
                        Enaktif
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100 text-earth-700">
                      {LEVEL_LABEL[p.level] ?? p.level}
                    </span>
                  </div>

                  {p.short_tagline && (
                    <p className="text-xs text-earth-600 line-clamp-2 mb-2">
                      {p.short_tagline}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-earth-700 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarRange className="w-3 h-3" strokeWidth={2.2} />
                      <strong className="text-ink">{nDays}</strong> /{' '}
                      {p.total_days} jou pwograme · {nTasks} tach
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" strokeWidth={2.2} />
                      <strong className="text-ink">{enrolled}</strong> aktif
                      {totalEver > enrolled && (
                        <span className="text-earth-500">
                          {' '}
                          ({totalEver} total)
                        </span>
                      )}
                    </span>
                  </div>

                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span
                          key={t.slug}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-100"
                        >
                          <span aria-hidden>{t.icon}</span>
                          {t.label}
                        </span>
                      ))}
                      {extraTags > 0 && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-600">
                          + {extraTags}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-700 italic inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                      Pa gen tag — pwogram jeneral pou tout moun
                    </div>
                  )}
                </div>

                <ProgramRowActions
                  id={p.id}
                  slug={p.slug}
                  active={p.active}
                  planRequired={p.plan_required}
                />
              </article>
            );
          })}
        </div>
      )}
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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-white text-forest-800 shadow-sm'
          : 'text-earth-700 hover:text-ink'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
