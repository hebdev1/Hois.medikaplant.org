import Link from 'next/link';
import { Sparkles, Wind, Heart, HandHeart, ArrowRight } from 'lucide-react';

/**
 * Section "Kisa HOÏS ye?" sur la landing page. Importe verbatim les quatre
 * piliers de medikaplant.org/hois-2/ et amène le visiteur vers le pricing
 * ou les guides spirituels selon son intention. Voir CONTENT_VOICE.md pour
 * le registre.
 */
export default function HoisSection() {
  return (
    <section
      id="hois"
      className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-white"
    >
      {/* Decorative gold orb */}
      <div
        aria-hidden
        className="absolute top-20 -left-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(201,162,39,0.35) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-10 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(90,145,56,0.30) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        {/* Eyebrow + headline */}
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-sm font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
            Lakou HOÏS
          </span>
          <h2 className="text-3xl md:text-5xl xl:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
            Kisa{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #C9A227 0%, #856915 50%, #5A9138 100%)',
              }}
            >
              HOÏS
            </span>{' '}
            ye?
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed">
            <strong className="text-ink">HOÏS</strong> se yon mo sakre ki vle di{' '}
            <em className="text-amber-700 not-italic font-semibold">
              « Limyè »
            </em>{' '}
            ak{' '}
            <em className="text-amber-700 not-italic font-semibold">
              « Ekla Limyè »
            </em>
            . Nan yon mond kote fènwa alawonnbadè, li enpòtan pou n tounen fè{' '}
            <strong className="text-ink">zèv limyè</strong> a ak reprezante
            pwisans Limyè a.
          </p>
        </div>

        {/* Four pillar cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <PillarCard
            icon={Sparkles}
            color="#C9A227"
            number="01"
            title="Kisa HOÏS ye?"
            body="HOÏS se yon mo sakre — « Limyè », « Ekla Limyè ». Nan lakou sa w ap aprann kouman pou konekte ak Pwisans Granmèt Souf la, dekouvri misyon desten pèsonèl ou, ak fè zèv limyè sou latè."
            linkHref="/auth/login?redirect=/dashboard/guides/kisa-hois-ye"
          />
          <PillarCard
            icon={Heart}
            color="#5A9138"
            number="02"
            title="Zèv Limyè"
            body="Zèv Limyè se konsèp HOÏS la — aksyon konkrè pou materyalize limyè a. Chak jou nou reveye, nou dwe asire n fè yon zèv limyè pou kore pawòl espirityalite n epi pran fòm verite."
            linkHref="/auth/login?redirect=/dashboard/guides/zev-limye"
          />
          <PillarCard
            icon={Wind}
            color="#2D5A1B"
            number="03"
            title="Pwisans Granmèt Souf la"
            body="Se « Souf » la ki pèmèt tout sa ki viv sou latè vivan. Granmèt Souf la se Kreyatè Siprèm nan, « Sila Ki Pa Gen Sou Tèt » — sila ki konn tout liniv è a nan fondas li."
            linkHref="/auth/login?redirect=/dashboard/guides/pwisans-granmet-souf-la"
          />
          <PillarCard
            icon={HandHeart}
            color="#856915"
            number="04"
            title="Charit"
            body="Charit se pi gwo prèv lanmou pou yon lòt ki nan bezwen. Yon zam espirityèl pwisan, yon zouti defans solid ki ede pwoteje lavi n kont tout fòm atak — fizik kou malefik."
            linkHref="/auth/login?redirect=/dashboard/guides/charit-pi-gwo-prev-lanmou"
          />
        </div>

        {/* Sacred quote */}
        <blockquote className="mt-16 max-w-[820px] mx-auto text-center">
          <p className="text-xl md:text-2xl text-ink/85 leading-relaxed font-serif italic">
            « Chak jou nou reveye nou dwe asire n fè yon zèv limyè, se fason
            pou n manifeste lanmou ak limyè Granmèt Souf epi fè pawòl ak
            espirityalite n pran fòm verite. »
          </p>
          <footer className="mt-5 text-sm text-ink-muted">
            — Pakou HOÏS
          </footer>
        </blockquote>

        {/* CTA */}
        <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="#pri"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white shadow-lg transition-all"
            style={{
              background:
                'linear-gradient(135deg, #C9A227 0%, #856915 50%, #5A9138 100%)',
            }}
          >
            Vwayaje sou pakou HOÏS la
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2.4}
            />
          </Link>
          <Link
            href="/auth/login?redirect=/dashboard/guides"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-medium border border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 text-ink transition-all"
          >
            Li 4 gid fondatè yo
          </Link>
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  icon: Icon,
  color,
  number,
  title,
  body,
  linkHref,
}: {
  icon: typeof Sparkles;
  color: string;
  number: string;
  title: string;
  body: string;
  linkHref: string;
}) {
  return (
    <article className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-card hover:shadow-cardHover transition-all hover:-translate-y-1">
      {/* Top accent stripe */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: color }}
      />

      {/* Number watermark */}
      <span
        aria-hidden
        className="absolute top-3 right-4 text-5xl font-display font-bold opacity-10 select-none"
        style={{ color }}
      >
        {number}
      </span>

      {/* Icon */}
      <span
        className="relative inline-grid place-items-center w-12 h-12 rounded-xl mb-4 shadow-sm"
        style={{
          background: `${color}1A`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </span>

      <h3 className="font-display text-lg font-bold text-ink leading-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">{body}</p>

      <Link
        href={linkHref}
        className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors group-hover:gap-1.5"
        style={{ color }}
      >
        Li gid la
        <ArrowRight className="w-3 h-3" strokeWidth={2.6} />
      </Link>
    </article>
  );
}
