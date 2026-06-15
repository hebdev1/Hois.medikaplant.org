import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Layers, ExternalLink, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { describeCondition } from '@/lib/conditions/catalog';
import SegmentBroadcastForm from './broadcast-form';

export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const info = describeCondition(slug);
  return { title: `Admin · Segman ${info.label}` };
}

export default async function SegmentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const info = describeCondition(slug);
  const supabase = createClient();

  // Find every user whose conditions array contains this slug. The
  // `cs.{slug}` filter uses Postgres' array contains operator, which
  // hits our GIN index on user_medical_info.conditions — fast even on
  // tens of thousands of rows.
  const { data: rows } = await supabase
    .from('user_medical_info')
    .select(
      'user_id, health_goal, profiles!inner(id, full_name, first_name, email, plan, role, created_at)'
    )
    .contains('conditions', [slug]);

  type RawRow = {
    user_id: string;
    health_goal: string | null;
    profiles:
      | { id: string; full_name: string | null; first_name: string | null; email: string; plan: 'basic' | 'premium' | 'vip'; role: string; created_at: string }
      | { id: string; full_name: string | null; first_name: string | null; email: string; plan: 'basic' | 'premium' | 'vip'; role: string; created_at: string }[]
      | null;
  };
  const raw = (rows ?? []) as unknown as RawRow[];
  const members = raw
    .map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return p && p.role === 'user'
        ? {
            user_id: p.id,
            full_name: p.full_name,
            first_name: p.first_name,
            email: p.email,
            plan: p.plan,
            created_at: p.created_at,
            health_goal: r.health_goal,
          }
        : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));

  if (members.length === 0 && !isKnownSlug(slug)) {
    // Catch the case where someone bookmarks an obsolete slug.
    notFound();
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1200px] mx-auto">
      <Link
        href="/admin/health?tab=segments"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 transition mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
        Tounen nan tout segman yo
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" strokeWidth={2.2} />
          Segman maladi
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-5xl" aria-hidden>
            {info.icon}
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
              {info.label}
            </h1>
            <p className="text-sm text-earth-600 mt-1">
              <span className="font-mono">{slug}</span> ·{' '}
              <strong>{members.length}</strong>{' '}
              {members.length === 1 ? 'manm' : 'manm'} nan segman sa
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 md:gap-8">
        {/* ── Members list ─────────────────────────────────────────────── */}
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
          <header className="px-5 py-4 border-b border-cream-200">
            <h2 className="font-display text-lg font-bold text-ink">
              Manm yo ({members.length})
            </h2>
          </header>
          {members.length === 0 ? (
            <div className="p-10 text-center text-sm text-earth-600">
              Pa gen okenn manm nan segman sa pou kounye a.
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {members.map((m) => (
                <li key={m.user_id}>
                  <Link
                    href={`/admin/users/${m.user_id}`}
                    className="block px-5 py-3 hover:bg-cream-50/70 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-sm"
                        aria-hidden
                      >
                        {(m.first_name?.[0] ??
                          m.full_name?.[0] ??
                          m.email[0] ??
                          '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-ink truncate">
                            {m.full_name ?? m.email.split('@')[0]}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              PLAN_TONE[m.plan] ?? PLAN_TONE.basic
                            }`}
                          >
                            {PLAN_LABEL[m.plan]}
                          </span>
                        </div>
                        <div className="text-xs text-earth-600 font-mono truncate">
                          {m.email}
                        </div>
                        {m.health_goal && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-earth-500">
                            <Activity className="w-3 h-3" strokeWidth={2.4} />
                            Objektif: {m.health_goal}
                          </div>
                        )}
                      </div>
                      <ExternalLink
                        className="w-3.5 h-3.5 text-earth-400 group-hover:text-forest-700 shrink-0"
                        strokeWidth={2.4}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Broadcast aside ──────────────────────────────────────────── */}
        <aside>
          <SegmentBroadcastForm
            slug={slug}
            label={info.label}
            memberIds={members.map((m) => m.user_id)}
          />
        </aside>
      </div>
    </div>
  );
}

function isKnownSlug(slug: string): boolean {
  // Any slug at all is allowed — we render the prettified label for
  // free-form values too. The notFound() above only triggers when the
  // segment is empty AND we can't even prettify (which means slug
  // itself was empty / whitespace).
  return slug.trim().length > 0;
}
