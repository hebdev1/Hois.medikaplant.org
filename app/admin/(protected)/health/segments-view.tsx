import Link from 'next/link';
import { Layers, Users as UsersIcon, ChevronRight, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  CONDITION_GROUP_LABEL,
  type ConditionGroup,
  describeCondition,
  compareConditionSlug,
} from '@/lib/conditions/catalog';

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

export default async function SegmentsView() {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('user_medical_info')
    .select(
      'user_id, conditions, profiles!inner(id, full_name, email, plan, role)'
    )
    .neq('conditions', '{}');

  type RawRow = {
    user_id: string;
    conditions: string[] | null;
    profiles:
      | { id: string; full_name: string | null; email: string; plan: 'basic' | 'premium' | 'vip'; role: string }
      | { id: string; full_name: string | null; email: string; plan: 'basic' | 'premium' | 'vip'; role: string }[]
      | null;
  };
  const raw = (rows ?? []) as unknown as RawRow[];

  type MemberInSegment = {
    user_id: string;
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  };
  type Bucket = { slug: string; members: MemberInSegment[] };
  const bucketsBySlug = new Map<string, Bucket>();
  for (const row of raw) {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!p || p.role !== 'user') continue;
    for (const cond of (row.conditions ?? []).filter(Boolean)) {
      let bucket = bucketsBySlug.get(cond);
      if (!bucket) {
        bucket = { slug: cond, members: [] };
        bucketsBySlug.set(cond, bucket);
      }
      bucket.members.push({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        plan: p.plan,
      });
    }
  }

  const buckets = Array.from(bucketsBySlug.values()).sort((a, b) =>
    compareConditionSlug(a.slug, b.slug)
  );

  const bucketsByGroup = new Map<ConditionGroup, Bucket[]>();
  for (const b of buckets) {
    const info = describeCondition(b.slug);
    const arr = bucketsByGroup.get(info.group) ?? [];
    arr.push(b);
    bucketsByGroup.set(info.group, arr);
  }

  const totalMembersWithConditions = new Set(
    buckets.flatMap((b) => b.members.map((m) => m.user_id))
  ).size;

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <Stat label="Total segman" value={buckets.length.toString()} tone="forest" />
        <Stat label="Manm ak yon kondisyon" value={totalMembersWithConditions.toString()} tone="gold" />
        <Stat
          label="Pi gwo segman"
          value={
            buckets.length > 0
              ? `${describeCondition(buckets[0].slug).label} (${buckets[0].members.length})`
              : '—'
          }
          tone="rose"
        />
      </section>

      {buckets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-10 text-center">
          <UsersIcon
            className="w-8 h-8 mx-auto text-earth-400 mb-3"
            strokeWidth={1.6}
          />
          <p className="text-sm text-earth-700 font-medium">
            Pa gen manm ki gen yon kondisyon ki anrejistre ankò.
          </p>
        </div>
      ) : (
        Array.from(bucketsByGroup.entries()).map(([group, items]) => (
          <section key={group} className="mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-3 flex items-center gap-2">
              {CONDITION_GROUP_LABEL[group]}
              <span className="text-earth-400 font-normal normal-case tracking-normal">
                · {items.length} segman
              </span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((bucket) => {
                const info = describeCondition(bucket.slug);
                const preview = bucket.members.slice(0, 5);
                return (
                  <Link
                    key={bucket.slug}
                    href={`/admin/health/segments/${encodeURIComponent(bucket.slug)}`}
                    className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card hover:shadow-plant hover:border-forest-300 transition group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0" aria-hidden>
                          {info.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="font-display text-base font-bold text-ink truncate">
                            {info.label}
                          </div>
                          <div className="text-[10px] font-mono text-earth-500 truncate">
                            {bucket.slug}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-earth-400 group-hover:text-forest-700 group-hover:translate-x-0.5 transition shrink-0 mt-1"
                        strokeWidth={2.4}
                      />
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="font-display text-2xl font-bold text-ink">
                        {bucket.members.length}
                      </span>
                      <span className="text-xs text-earth-600">manm</span>
                    </div>
                    <ul className="space-y-1">
                      {preview.map((m) => (
                        <li
                          key={m.user_id}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <span
                            className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-bold text-[10px] shrink-0"
                            aria-hidden
                          >
                            {(m.full_name?.[0] ?? m.email[0] ?? '?').toUpperCase()}
                          </span>
                          <span className="truncate text-ink flex-1">
                            {m.full_name || m.email.split('@')[0]}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${
                              PLAN_TONE[m.plan] ?? PLAN_TONE.basic
                            }`}
                          >
                            {PLAN_LABEL[m.plan]}
                          </span>
                        </li>
                      ))}
                      {bucket.members.length > preview.length && (
                        <li className="text-[10px] text-earth-500 italic pl-7">
                          + {bucket.members.length - preview.length} lòt
                        </li>
                      )}
                    </ul>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}

      {buckets.length > 0 && (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-4 text-sm text-earth-700">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
            <Bell className="w-3.5 h-3.5" strokeWidth={2.4} />
            Avi
          </div>
          Klike sou yon segman pou wè tout manm li yo + voye yon notifikasyon
          bay tout segman an alafwa.
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  tone = 'cream',
}: {
  label: string;
  value: string;
  tone?: 'cream' | 'forest' | 'rose' | 'gold';
}) {
  const toneStyles: Record<typeof tone, string> = {
    cream: 'bg-cream-50 border-cream-200 text-earth-800',
    forest: 'bg-forest-50 border-forest-200 text-forest-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    gold: 'bg-gold-50 border-gold-200 text-gold-800',
  } as const;
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-1 ${toneStyles[tone]}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tracking-tight truncate">
        {value}
      </div>
    </div>
  );
}
