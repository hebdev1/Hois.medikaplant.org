import Link from 'next/link';
import { Clock, Languages } from 'lucide-react';
import PlantBig from './plant-big';
import type { Database } from '@/types/database';

type Guide = Database['public']['Tables']['guides']['Row'];
type GuideArt = Database['public']['Enums']['guide_art'];

type GuideCardProps = {
  guide: Pick<
    Guide,
    | 'id'
    | 'slug'
    | 'title'
    | 'excerpt'
    | 'tag'
    | 'accent_color'
    | 'art'
    | 'read_minutes'
    | 'language'
  >;
};

const LANGUAGE_LABEL: Record<string, string> = {
  ht: 'Kreyòl',
  fr: 'Français',
  en: 'English',
};

export default function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link
      href={`/dashboard/guides/${guide.slug}`}
      className="group flex flex-col bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition-all"
    >
      {/* Decorative art header */}
      <div
        className="relative aspect-[16/9] grid place-items-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${guide.accent_color}, ${guide.accent_color}AA)`,
        }}
      >
        {guide.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur text-[10px] font-bold text-ink uppercase tracking-wider">
            {guide.tag}
          </span>
        )}
        <div className="transition-transform group-hover:scale-105 group-hover:rotate-3">
          <PlantBig
            art={guide.art as GuideArt}
            accent="#FFFDF8"
            opacity={0.78}
            size={130}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-5">
        <h3 className="font-display text-lg font-bold text-ink leading-snug line-clamp-2 group-hover:text-forest-700 transition-colors">
          {guide.title}
        </h3>
        <p className="mt-2 text-sm text-earth-600 line-clamp-3 leading-relaxed flex-1">
          {guide.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-3 text-[11px] text-earth-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2.2} />
            {guide.read_minutes} min
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Languages className="w-3 h-3" strokeWidth={2.2} />
            {LANGUAGE_LABEL[guide.language] ?? guide.language}
          </span>
        </div>
      </div>
    </Link>
  );
}
