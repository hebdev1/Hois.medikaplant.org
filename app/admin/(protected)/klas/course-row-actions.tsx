'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleCourseFlag, deleteCourse } from './actions';

type Props = {
  id: string;
  featured: boolean;
  active: boolean;
};

export default function CourseRowActions({ id, featured, active }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [localFeatured, setLocalFeatured] = React.useState(featured);
  const [localActive, setLocalActive] = React.useState(active);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => setLocalFeatured(featured), [featured]);
  React.useEffect(() => setLocalActive(active), [active]);

  async function flip(field: 'featured' | 'active') {
    if (busy) return;
    setBusy(field);
    try {
      const res = await toggleCourseFlag(id, field);
      if (res.ok) {
        if (field === 'featured') setLocalFeatured(res.value);
        else setLocalActive(res.value);
        router.refresh();
      } else {
        window.alert(res.error);
      }
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
    setBusy('delete');
    try {
      const res = await deleteCourse(id);
      if (res.ok) {
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-1 self-center">
      <ActionButton
        title={localFeatured ? 'Retire vedèt' : 'Make vedèt'}
        active={localFeatured}
        busy={busy === 'featured'}
        onClick={() => flip('featured')}
        ActiveIcon={Star}
        InactiveIcon={StarOff}
        activeClass="text-gold-700 bg-gold-100"
      />
      <ActionButton
        title={localActive ? 'Despiblike' : 'Pibliye'}
        active={localActive}
        busy={busy === 'active'}
        onClick={() => flip('active')}
        ActiveIcon={Eye}
        InactiveIcon={EyeOff}
        activeClass="text-forest-700 bg-forest-100"
      />
      <Link
        href={`/admin/klas/${id}`}
        title="Edite kou a"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:bg-cream-100 hover:text-ink"
      >
        <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy === 'delete'}
        title={confirmDelete ? 'Klike yon dezyèm fwa pou konfime' : 'Efase kou a'}
        className={cn(
          'grid place-items-center w-8 h-8 rounded-lg transition',
          confirmDelete
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'text-rose-600 hover:bg-rose-50'
        )}
      >
        {busy === 'delete' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
      </button>
    </div>
  );
}

function ActionButton({
  title,
  active,
  busy,
  onClick,
  ActiveIcon,
  InactiveIcon,
  activeClass,
}: {
  title: string;
  active: boolean;
  busy: boolean;
  onClick: () => void;
  ActiveIcon: typeof Star;
  InactiveIcon: typeof Star;
  activeClass: string;
}) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      aria-pressed={active}
      className={cn(
        'grid place-items-center w-8 h-8 rounded-lg transition',
        active
          ? activeClass
          : 'text-earth-600 hover:bg-cream-100 hover:text-ink',
        busy && 'opacity-60'
      )}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
      ) : (
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
      )}
    </button>
  );
}
