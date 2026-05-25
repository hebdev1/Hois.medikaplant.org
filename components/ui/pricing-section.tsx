import { Check, Sparkles } from 'lucide-react';
import { BentoPricing, type BentoPlan } from '@/components/ui/bento-pricing';

/**
 * Pricing section on the public landing page. Switched from the previous
 * 3-equal-column card grid to the shadcn bento layout the operator asked
 * for: Sitwonèl (popular) takes a 5-col featured card with a SparklesIcon
 * callout, Bazilik fills 3 cols, Melis fills 4 cols.
 *
 * Each plan's CTA is a real Next.js Link via the new ctaHref prop so the
 * visitor lands on /checkout?plan=X with one click.
 */

const PLANS: BentoPlan[] = [
  {
    titleBadge: 'HOÏS SITWONÈL · POPILÈ',
    priceLabel: '$600',
    priceSuffix: '/ 2 ane',
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè davans pou li kèk pòs anvan li piblik',
      'Aksè privilejye nan tout aktivite Hoïs',
      'Rabè sou MedikaplantShop',
      'Salon, prezantasyon, fòmasyon gratis sou gwoup VIP la',
      'Konsèy ak sipò sipirityèl ayisyen',
      'Motivasyon ak gidans espirityèl',
    ],
    cta: 'Vin manm Sitwonèl',
    ctaHref: '/checkout?plan=premium',
    featured: true,
    featuredTagline: 'Pi rekòmande',
  },
  {
    titleBadge: 'HOÏS BAZILIK',
    priceLabel: '$350',
    priceSuffix: '/ 1 ane',
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè privilejye nan aktivite Hoïs & Medikaplant',
      'Rabè sou MedikaplantShop',
      'Konsèy ak sipò sipirityèl tradisyonèl',
    ],
    cta: 'Vin manm',
    ctaHref: '/checkout?plan=basic',
  },
  {
    titleBadge: 'HOÏS MELIS · VIP',
    priceLabel: '$800',
    priceSuffix: '/ 3 ane',
    features: [
      'Tout sa ki nan Hoïs Sitwonèl',
      'Konsiltasyon patikilye sou ka maladi mistik',
      'Non w pibliye sou paj Hoïs VIP nan Medikaplant.org',
      'Mayo Hoïs + lòt sipriz',
      'Yon konvèsasyon konfidansyèl 21 minit ak Vye Ewòl',
      'Limyè eksklizif (Primè) sou gwo fenomèn mondyal',
    ],
    cta: 'Vin manm Melis',
    ctaHref: '/checkout?plan=vip',
  },
];

export default function PricingSection() {
  return (
    <section
      id="pri"
      className="relative w-full py-24 md:py-32 bg-gradient-to-b from-white via-brand-50/30 to-white overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-brand-200/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-[1180px] mx-auto px-4 md:px-12">
        {/* Heading */}
        <div className="flex flex-col items-center text-center max-w-[760px] mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            Plan Hoïs VIP
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
            Chwazi plan ki{' '}
            <span className="text-brand-600">adapte ak vwayaj</span> ou
          </h2>
          <p className="mt-5 text-base md:text-lg text-ink-muted leading-relaxed">
            Twa nivo ladesyon pou rantre nan kominote Hoïs la. Chak plan
            louvri pòt pou pi gwo aksè a remèd fèy, konsèy espirityèl, ak
            yon eksperyans natiropatik konplè.
          </p>
        </div>

        {/* Bento grid */}
        <BentoPricing plans={PLANS} />

        {/* Reassurance */}
        <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Pèman sekirize
          </span>
          <span
            aria-hidden
            className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300"
          />
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Anile nenpòt lè
          </span>
          <span
            aria-hidden
            className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300"
          />
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-600" strokeWidth={3} />
            Sipò 24/7 nan kreyòl ak fransè
          </span>
        </div>
      </div>
    </section>
  );
}
