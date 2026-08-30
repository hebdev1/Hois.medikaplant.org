'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  listCourseAccess,
  grantCourseAccess,
  revokeCourseAccess,
  type AccessMember,
} from './actions';

type CourseOpt = { id: string; title: string; active: boolean };

const SOURCE: Record<string, { label: string; cls: string }> = {
  admin_grant: { label: 'Admin', cls: 'bg-amber-100 text-amber-800' },
  click: { label: 'Gratis', cls: 'bg-amber-100 text-amber-800' },
  purchase: { label: 'Acha', cls: 'bg-forest-100 text-forest-700' },
  subscription: { label: 'Plan', cls: 'bg-sky-100 text-sky-700' },
};

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];
function dateHT(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CourseAccessManager({ courses }: { courses: CourseOpt[] }) {
  const [courseId, setCourseId] = React.useState(courses[0]?.id ?? '');
  const [members, setMembers] = React.useState<AccessMember[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [grantEmail, setGrantEmail] = React.useState('');
  const [granting, setGranting] = React.useState(false);
  const [grantMsg, setGrantMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  const load = React.useCallback(async (id: string) => {
    if (!id) {
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await listCourseAccess(id);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setMembers([]);
      return;
    }
    setMembers(res.members);
  }, []);

  React.useEffect(() => {
    load(courseId);
  }, [courseId, load]);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !grantEmail.trim()) return;
    setGranting(true);
    setGrantMsg(null);
    const res = await grantCourseAccess(courseId, grantEmail);
    setGranting(false);
    if (!res.ok) {
      setGrantMsg({ ok: false, text: res.error });
      return;
    }
    setGrantMsg({ ok: true, text: 'Aksè bay ✓' });
    setGrantEmail('');
    load(courseId);
  }

  async function onRevoke(m: AccessMember) {
    if (!window.confirm(`Retire aksè pou ${m.name}? Li p ap ka wè kou a ankò.`)) {
      return;
    }
    setRevoking(m.user_id);
    const res = await revokeCourseAccess(courseId, m.user_id);
    setRevoking(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMembers((prev) => (prev ? prev.filter((x) => x.user_id !== m.user_id) : prev));
  }

  const count = members?.length ?? 0;
  const inputCls =
    'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300';

  return (
    <section className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
      <header className="px-4 md:px-5 py-3.5 border-b border-cream-200 flex items-start gap-2.5">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest-100 text-forest-700 shrink-0">
          <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-ink">Kontwòl aksè</h3>
          <p className="text-[11px] text-earth-600 mt-0.5">
            Chwazi yon kou pou wè ki moun ki gen aksè. Bay aksè ak yon imèl, oswa
            retire aksè yon moun ki jwenn li pa erè.
          </p>
        </div>
      </header>

      <div className="p-4 md:p-5 space-y-4">
        {/* Course picker */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-semibold text-earth-700 shrink-0">
            Kou
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={cn(inputCls, 'sm:max-w-md')}
          >
            {courses.length === 0 && <option value="">Pa gen kou</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.active ? '' : ' (pa pibliye)'}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-700 sm:ml-auto shrink-0">
            <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
            {count} moun gen aksè
          </span>
        </div>

        {/* Grant access */}
        <form onSubmit={onGrant} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="Imèl manm nan pou bay aksè…"
            className={cn(inputCls, 'flex-1')}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={granting || !grantEmail.trim() || !courseId}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition shrink-0"
          >
            {granting ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <UserPlus className="w-4 h-4" strokeWidth={2.2} />
            )}
            Bay aksè
          </button>
        </form>
        {grantMsg && (
          <p
            className={cn(
              'text-xs font-semibold flex items-center gap-1.5',
              grantMsg.ok ? 'text-forest-700' : 'text-rose-700'
            )}
          >
            {grantMsg.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            {grantMsg.text}
          </p>
        )}

        {/* Roster */}
        <div className="rounded-xl border border-cream-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-earth-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
              Chaje…
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-rose-700 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" strokeWidth={2.2} />
              {error}
            </div>
          ) : count === 0 ? (
            <div className="p-8 text-center text-sm text-earth-500">
              Pa gen okenn moun ki gen aksè a kou sa a.
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {members!.map((m) => {
                const src = SOURCE[m.source] ?? {
                  label: m.source,
                  cls: 'bg-cream-200 text-earth-700',
                };
                const initials = (m.name?.[0] ?? m.email?.[0] ?? 'M').toUpperCase();
                return (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50/60"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0 overflow-hidden">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatar_url}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">
                        {m.name}
                      </div>
                      <div className="text-[11px] text-earth-500 truncate">
                        {m.email}
                        {m.enrolled_at && (
                          <span className="text-earth-400">
                            {' · '}
                            {dateHT(m.enrolled_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0',
                        src.cls
                      )}
                    >
                      {src.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRevoke(m)}
                      disabled={revoking === m.user_id}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 disabled:opacity-60 px-2 py-1 rounded-lg hover:bg-rose-50 transition shrink-0"
                    >
                      {revoking === m.user_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                      )}
                      Retire aksè
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-[11px] text-earth-500">
          Pou kreye yon nouvo kont oswa modifye yon manm, ale nan{' '}
          <Link href="/admin/users" className="text-forest-700 font-semibold underline">
            Manm yo
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
