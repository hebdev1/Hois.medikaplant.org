import Link from 'next/link';
import {
  Droplet,
  Heart,
  Wind,
  Bone,
  Pill,
  Droplets,
  Brain,
  Moon,
  Activity,
  Sparkles,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConditionMeta = {
  label: string;
  icon: LucideIcon;
  tone: string;
  relatedMetric?: 'blood_sugar' | 'weight' | 'pressure';
};

// Mirror of the predefined options in settings → Enfòmasyon Sante →
// Kondisyon medikal aktyèl. Unknown / custom conditions fall through
// to the default chip.
const CONDITIONS: Record<string, ConditionMeta> = {
  diabetes_type_1: {
    label: 'Dyabèt Tip 1',
    icon: Droplet,
    tone: 'bg-rose-100 text-rose-700',
    relatedMetric: 'blood_sugar',
  },
  diabetes_type_2: {
    label: 'Dyabèt Tip 2',
    icon: Droplet,
    tone: 'bg-rose-100 text-rose-700',
    relatedMetric: 'blood_sugar',
  },
  hypertension: {
    label: 'Tansyon wo',
    icon: Heart,
    tone: 'bg-amber-100 text-amber-700',
    relatedMetric: 'pressure',
  },
  hypotension: {
    label: 'Tansyon ba',
    icon: Heart,
    tone: 'bg-sky-100 text-sky-700',
    relatedMetric: 'pressure',
  },
  asthma: { label: 'Opresyon', icon: Wind, tone: 'bg-indigo-100 text-indigo-700' },
  arthritis: { label: 'Atrit', icon: Bone, tone: 'bg-stone-100 text-stone-700' },
  cholesterol: {
    label: 'Kolestewòl wo',
    icon: Pill,
    tone: 'bg-yellow-100 text-yellow-700',
    relatedMetric: 'weight',
  },
  anemia: { label: 'Anemi', icon: Droplets, tone: 'bg-rose-100 text-rose-700' },
  thyroid: { label: 'Tirowid', icon: Activity, tone: 'bg-violet-100 text-violet-700' },
  kidney: { label: 'Ren', icon: Droplets, tone: 'bg-sky-100 text-sky-700' },
  liver: { label: 'Fwa', icon: Sparkles, tone: 'bg-forest-100 text-forest-700' },
  gastric: { label: 'Dijesyon', icon: Pill, tone: 'bg-orange-100 text-orange-700' },
  migraine: { label: 'Migrèn', icon: Brain, tone: 'bg-violet-100 text-violet-700' },
  depression: { label: 'Depresyon', icon: Moon, tone: 'bg-indigo-100 text-indigo-700' },
  anxiety: { label: 'Anksyete', icon: Brain, tone: 'bg-amber-100 text-amber-700' },
  insomnia: { label: 'Pwoblèm somèy', icon: Moon, tone: 'bg-slate-100 text-slate-700' },
};

function metaFor(condition: string): ConditionMeta {
  return (
    CONDITIONS[condition] ?? {
      label: condition.replace(/_/g, ' '),
      icon: Activity,
      tone: 'bg-cream-100 text-earth-700',
    }
  );
}

export default function ConditionsStrip({
  conditions,
  activeMetric,
}: {
  conditions: string[];
  activeMetric: 'blood_sugar' | 'weight' | 'pressure';
}) {
  if (conditions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-200 bg-cream-50 px-4 py-3 flex items-center gap-3 text-sm text-earth-700">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-cream-100 text-earth-600">
          <Activity className="w-4 h-4" strokeWidth={2} />
        </span>
        <span className="flex-1">
          Poko gen kondisyon ki anrejistre. Konplete sou paj{' '}
          <Link href="/dashboard/settings" className="font-semibold text-forest-700 hover:underline">
            Enfòmasyon Sante
          </Link>{' '}
          pou nou ka pèsonalize swivi ou.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-forest-100 bg-forest-50/40 px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold shrink-0">
        Kondisyon w yo
      </span>
      <ul className="flex flex-wrap items-center gap-2 flex-1">
        {conditions.map((c) => {
          const meta = metaFor(c);
          const Icon = meta.icon;
          const relevant = meta.relatedMetric === activeMetric;
          return (
            <li key={c}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                  meta.tone,
                  relevant
                    ? 'ring-2 ring-forest-300 border-forest-200'
                    : 'border-transparent'
                )}
                title={
                  relevant
                    ? `Mezi ${activeMetric === 'blood_sugar' ? 'sik nan san' : activeMetric === 'pressure' ? 'tansyon' : 'pwa'} relevan ak ${meta.label}`
                    : meta.label
                }
              >
                <Icon className="w-3 h-3" strokeWidth={2.4} />
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/dashboard/settings"
        title="Modifye"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-500 hover:text-forest-700 hover:bg-white transition"
      >
        <Settings className="w-3.5 h-3.5" strokeWidth={2.2} />
      </Link>
    </div>
  );
}

// Helper exported for the page to compute which metric is "primary" for a
// user given their conditions — the first matching condition wins.
export function primaryMetricFor(
  conditions: string[]
): 'blood_sugar' | 'weight' | 'pressure' | null {
  for (const c of conditions) {
    const m = CONDITIONS[c]?.relatedMetric;
    if (m) return m;
  }
  return null;
}
