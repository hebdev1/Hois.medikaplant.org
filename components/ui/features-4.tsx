import {
  Leaf,
  Stethoscope,
  Heart,
  BookOpen,
  Mountain,
  Users,
} from 'lucide-react';

/**
 * Hoïs values grid — adapted from the shadcn features-4 block.
 *
 * Stays faithful to the original's divided-cell aesthetic
 * (`divide-x divide-y border *:p-12 grid sm:grid-cols-2 lg:grid-cols-3`)
 * but rewrites the copy in Kreyòl and tints icons with brand-600 so
 * the component drops into the rest of /istwa-nou without looking
 * imported from a different site. Used in place of the older 4-card
 * values block on the "Itwa nou" page.
 */
export function Features() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center md:space-y-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
            Sa nou kwè
          </span>
          <h2 className="font-display text-balance text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
            6 valè ki gide chak desizyon nou pran
          </h2>
          <p className="text-ink-muted text-base md:text-lg leading-relaxed">
            Yon SaaS pa fèt nan moman an. Li bati sou prensip ki rete menm
            depi premye jou — sa yo se boussol Hoïs Inivèsite a.
          </p>
        </div>

        <div className="relative mx-auto grid max-w-2xl lg:max-w-4xl divide-x divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden *:p-10 md:*:p-12 sm:grid-cols-2 lg:grid-cols-3 bg-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Tradisyon</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Konesans plant medisinal Ayisyèn nou, transmèt jenerasyon apre
              jenerasyon san pèdi yon ti grenn.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Lasyans</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Chak tretman dwe rete jistifye ak rechèch klinik aktyèl —
              tradisyon ak lasyans pa ènmi.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Bonjan Swen</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Yon apwòch holistik: kò, lespri, ak nanm gen menm valè epi
              menm bezwen pou yo prospere.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Edikasyon</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Aprann manm yo otonomi sou pwòp sante yo, pa kreye depandans —
              yon manm enfòme se yon manm pwoteje.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mountain className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Respè</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Pou Granmèt ki kreye plant yo, pou tè ki kiltive yo, ak pou
              chak istwa ki pote yo nan men nou.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-brand-600" strokeWidth={2.2} />
              <h3 className="text-sm font-semibold text-ink">Kominote</h3>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Yon rezo manm an Ayiti ak nan dyaspora ki sipòte youn lòt —
              gerizon pa janm fèt nan solitid.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
