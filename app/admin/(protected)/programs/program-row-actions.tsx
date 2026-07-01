'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Copy,
  CalendarRange,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  toggleProgramActive,
  deleteProgram,
  duplicateProgram,
  setProgramPlanGate,
} from './actions';

type Plan = 'basic' | 'premium' | 'vip';

type Props = {
  id: string;
  slug: string;
  active: boolean;
  planRequired: Plan;
};

const PLAN_LABEL: Record<Plan, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

export default function ProgramRowActions({
  id,
  slug,
  active,
  planRequired,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<
    'active' | 'dup' | 'del' | 'plan' | null
  >(null);
  const [localActive, setLocalActive] = React.useState(active);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [planMenuOpen, setPlanMenuOpen] = React.useState(false);

  React.useEffect(() => setLocalActive(active), [active]);

  async function onToggleActive() {
    if (busy) return;
    setBusy('active');
    try {
      const res = await toggleProgramActive(id);
      if (res.ok) {
        setLocalActive(res.active);
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } finally {
      setBusy(null);
    }
  }

  async function onSetPlan(plan: Plan) {
    if (busy) return;
    setPlanMenuOpen(false);
    if (plan === planRequired) return;
    setBusy('plan');
    try {
      const res = await setProgramPlanGate(id, plan);
      if (res.ok) router.refresh();
      else window.alert(res.error);
    } finally {
      setBusy(null);
    }
  }

  async function onDuplicate() {
    if (busy) return;
    setBusy('dup');
    try {
      const res = await duplicateProgram(id);
      if (res.ok) router.push(`/admin/programs/${res.newId}`);
      else window.alert(res.error);
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    if (busy) return;
    setBusy('del');
    try {
      const res = await deleteProgram(id);
      if (res.ok) router.refresh();
      else window.alert(res.error);
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-1 self-center pr-3">
      {/* Plan gate quick-change */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPlanMenuOpen((s) => !s)}
          disabled={busy === 'plan'}
          title="Chanje plan minimòm"
          className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:bg-cream-100 hover:text-ink"
        >
          {busy === 'plan' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : (
            <Shield className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
        </button>
        {planMenuOpen && (
          <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-cream-200 rounded-xl shadow-plant w-40 py-1">
            {(['basic', 'premium', 'vip'] as Plan[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSetPlan(p)}
                className={cn(
                  'block w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-cream-100',
                  planRequired === p && 'bg-forest-50 text-forest-800'
                )}
              >
                {PLAN_LABEL[p]}
                {planRequired === p && <span className="ml-1">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleActive}
        disabled={busy === 'active'}
        title={localActive ? 'Dezaktive' : 'Aktive'}
        aria-pressed={localActive}
        className={cn(
          'grid place-items-center w-8 h-8 rounded-lg transition',
          localActive
            ? 'text-forest-700 bg-forest-50'
            : 'text-earth-600 hover:bg-cream-100'
        )}
      >
        {busy === 'active' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : localActive ? (
          <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
        ) : (
          <EyeOff className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
      </button>

      <Link
        href={`/admin/health/programs/${slug}`}
        title="Ouvri kalandriye tach jou pa jou"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:bg-cream-100 hover:text-ink"
      >
        <CalendarRange className="w-3.5 h-3.5" strokeWidth={2.2} />
      </Link>

      <Link
        href={`/admin/programs/${id}`}
        title="Modifye pwogram lan"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:bg-cream-100 hover:text-ink"
      >
        <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
      </Link>

      <button
        type="button"
        onClick={onDuplicate}
        disabled={busy === 'dup'}
        title="Duplike"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:bg-cream-100 hover:text-ink"
      >
        {busy === 'dup' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={busy === 'del'}
        title={confirmDelete ? 'Klike ankò pou konfime' : 'Efase'}
        className={cn(
          'grid place-items-center w-8 h-8 rounded-lg transition',
          confirmDelete
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'text-rose-600 hover:bg-rose-50'
        )}
      >
        {busy === 'del' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
      </button>
    </div>
  );
}
