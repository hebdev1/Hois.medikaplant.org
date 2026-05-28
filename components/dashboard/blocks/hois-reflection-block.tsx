import Link from 'next/link';
import { Mountain, Quote, ArrowRight } from 'lucide-react';

/**
 * Spiritual reflection block — surfaces for members whose goal is
 * 'spiritual_balance' (high in their stack) or any VIP member (lower).
 * Rotates a daily HOÏS reflection so the dashboard feels alive for the
 * spiritually-oriented member, not just a numbers tracker.
 *
 * The reflection is chosen deterministically from the day-of-year so it
 * stays stable across a member's visits on the same day but changes
 * daily — no DB round-trip needed.
 */

const REFLECTIONS: { text: string; source: string }[] = [
  {
    text: 'Granmèt mete chak fèy sou tè a ak yon entansyon. Lè ou bwè yon tizan ak respè, ou resevwa entansyon sa.',
    source: 'Pilye Limyè',
  },
  {
    text: 'Gerizon kò a kòmanse nan kalm lespri a. Pran yon souf, di mèsi, epi kontinye.',
    source: 'Pilye Kè',
  },
  {
    text: 'Ou pa poukont ou. Chak manm nan kominote a ap mache menm chemen gerizon an avè w.',
    source: 'Pilye Kominote',
  },
  {
    text: 'Plant la pa fè mirak — li ouvri pòt la. Se konsistans ou ki travèse li.',
    source: 'Pilye Mistik',
  },
  {
    text: 'Pale ak Granmèt chak maten avan ou pran premye remèd ou. Konvèsasyon sa se premye medikaman an.',
    source: 'Pilye Konvèsasyon',
  },
  {
    text: 'Repo se yon fòm gerizon. Kò ki janm dòmi pa janm geri nèt.',
    source: 'Pilye Limyè',
  },
  {
    text: 'Sa ou plante ak pasyans, ou rekòlte ak abondans. Sante se yon jaden, pa yon kous.',
    source: 'Pilye Kè',
  },
];

function reflectionOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / 86400000
  );
  return REFLECTIONS[dayOfYear % REFLECTIONS.length];
}

export default function HoisReflectionBlock() {
  const reflection = reflectionOfTheDay();

  return (
    <section className="rounded-2xl overflow-hidden shadow-card relative bg-gradient-to-br from-[#1a1052] via-ink to-[#2d1b4e] text-cream-50">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(201,162,39,0.25), transparent 45%), radial-gradient(circle at 15% 90%, rgba(122,175,82,0.2), transparent 40%)',
        }}
      />
      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 text-gold-200">
            <Mountain className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-cream-100/70 font-bold">
            Refleksyon HOÏS jounen an
          </span>
        </div>

        <Quote className="w-7 h-7 text-gold-200/60 mb-2" strokeWidth={1.8} />
        <blockquote className="font-display text-xl md:text-2xl font-medium leading-snug text-cream-50 max-w-2xl">
          {reflection.text}
        </blockquote>
        <div className="mt-3 text-sm text-gold-200 font-semibold">
          — {reflection.source}
        </div>

        <Link
          href="/dashboard/guides"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 rounded-full transition"
        >
          Eksplore ansèyman HOÏS yo
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
