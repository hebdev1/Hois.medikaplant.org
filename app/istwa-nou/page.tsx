import Image from 'next/image';
import Link from 'next/link';
import {
  Leaf,
  Globe,
  Sparkles,
  Users,
  Sprout,
  Mountain,
  ArrowRight,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { Features } from '@/components/ui/features-4';

export const metadata = {
  title: 'Misyon Ak Vizyon nou · MedikaPlant Hoïs Inivèsite',
  description:
    'Misyon ak vizyon Hoïs Inivèsite se yon pon ant medsin tradisyonèl Ayisyen an ak teknoloji modèn pou byennèt total.',
};

const PILLARS = [
  {
    icon: Sprout,
    title: 'Rasin Ayisyen',
    body:
      'Tout plant nou pale sou yo soti nan tradisyon Ayisyèn ak Karayib la  pa gen yon konesans ki vin sot yon lòt kote.',
  },
  {
    icon: Mountain,
    title: 'Respè pou Granmèt',
    body:
      'HOÏS la se yon pilye santral: nou onore Granmèt souf la ki kreye tout plant yo epi nou aprann pasyans nan men li.',
  },
  {
    icon: Users,
    title: 'Kominote ki sipòte',
    body:
      'Yon rezo manm an Ayiti ak nan dyaspora ki pataje eksperyans, rezilta, ak ankourajman youn pou lòt.',
  },
];

const TIMELINE = [
  {
    year: '2019',
    title: 'Premye atizan plant lan',
    body:
      'MedikaPlant kòmanse ak yon ti boutik atizanal pou plant santiniye ki dispoze nan kominote Pòtoprens.',
  },
  {
    year: '2020',
    title: 'Bouton konsiltasyon an',
    body:
      'Pandemi an pouse nou voye konsiltasyon yo an vidyo pou rive jwenn dyaspora a + kliyan andeyò Pòtoprens.',
  },
  {
    year: '2023',
    title: 'Nesans HOÏS Inivèsite',
    body:
      'Kreasyon yon pwotokòl fòmasyon konplè ki kombine plant tradisyonèl ak swivi pèsonalize pou chak kondisyon.',
  },
  {
    year: '2026',
    title: 'Platfòm dijital konplè',
    body:
      'Lansman aplikasyon Hoïs SaaS — swivi sante, gid, fowòm, ak yon Ton vye an pèsòn.',
  },
];

const STATS = [
  { value: '8+', label: 'lane eksperyans' },
  { value: '12k+', label: 'manm aktiv' },
  { value: '120+', label: 'plant katalogize' },
  { value: '95%', label: 'satisfaksyon manm yo' },
];

export default function IstwaNouPage() {
  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        {/* Soft botanical decoration */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(22,163,74,0.08), transparent 40%), radial-gradient(circle at 10% 90%, rgba(196,49,120,0.06), transparent 35%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
              Misyon Ak Vizyon Nou 
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
              Misyon Ak <span className="text-brand-600">Vizyon nou</span>
              <br />
              
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
              Tout moun merite viv laj tèrès yo, sa vle di, kantite tan yo te vini fè isiba pandan pasaj yo isiba san maladi ak move kou malè pa voye yo ale anvan lè. 
              Plant yo gen pwopriyete ak pouvwa medisinal ak pwotektè sa nan yo. 
              Se konnen pou n aprann konnen, metrize ak manipile zouti lanati yo pou byen pou lavi kontinye fleri. 
              Misyon sakre Medikaplant se ede nan aprantisaj ak transfè konesans sa pou materyalize zèv Limyè a sou latè.
              Medikaplant se yon platfòm edikatif ak enfòmasyonèl sou plant ki nan lanati. Ansanm n ap dekouvri byenfè ak sekrè plant pou pwotoje lavi.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/#pri"
                className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-6 py-3 rounded-full font-medium transition shadow-md"
              >
                Vin manm
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
              >
                Kontakte nou
              </Link>
            </div>
          </div>

          {/* Decorative image collage */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
            <div className="relative aspect-[4/5] md:col-span-5 rounded-[1.5rem] overflow-hidden shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=800&q=80"
                alt="Plant santiniye"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md bg-white/70 rounded-xl px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  Tradisyon
                </div>
                <div className="text-sm font-semibold text-ink">
                  Plant ki te toujou la
                </div>
              </div>
            </div>
            <div className="relative aspect-[4/5] md:col-span-4 md:translate-y-8 rounded-[1.5rem] overflow-hidden shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=700&q=80"
                alt="Fèy"
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative col-span-2 md:col-span-3 grid grid-rows-2 gap-3 md:gap-4">
              <div className="relative aspect-square rounded-[1.5rem] overflow-hidden shadow-card">
                <Image
                  src="https://images.unsplash.com/photo-1620912189865-39be7388a8d3?auto=format&fit=crop&w=500&q=80"
                  alt="Tizan"
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="rounded-[1.5rem] bg-ink text-cream-50 p-5 md:p-6 flex flex-col justify-between shadow-card">
                <Leaf className="w-7 h-7 text-brand-300" strokeWidth={2.2} />
                <div>
                  <div className="text-2xl md:text-3xl font-display font-bold leading-none">
                    2018
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">
                    Depi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION + PILIYE YO ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-24">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                Misyon
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                Konsève konesans, pataje gerizon
              </h2>
              <p className="mt-6 text-ink-muted text-base md:text-lg leading-relaxed">
                Misyon nou se konekte konesans natiropatik Ayisyèn ak yon
                kominote dijital pou ke chak fanmi ka jwenn plant ki vrèman
                geri, ak yon Ton vye ki konnen sa li ap fè.
              </p>
              <p className="mt-4 text-ink-muted text-base leading-relaxed">
                Nou kwè medsin tradisyonèl la pa kont lasyans modèn — yo de
                vwa ki menm chemen. Hoïs Inivèsite ap fè yo travay ansanm.
              </p>
            </div>

            <div className="grid sm:grid-cols-1 gap-4">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 md:p-7 hover:border-brand-300 hover:shadow-card transition-all"
                >
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-brand-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-gradient text-white shadow-sm shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3 className="font-display text-xl md:text-2xl font-bold text-ink">
                        {title}
                      </h3>
                      <p className="mt-2 text-ink-muted leading-relaxed">{body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
              Chemen nou
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Soti yon ti pòt-fenèt, rive yon kominote
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              aria-hidden
              className="absolute left-5 md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-brand-200 via-brand-300 to-brand-200 md:-translate-x-1/2"
            />

            <ol className="space-y-10 md:space-y-16">
              {TIMELINE.map((item, idx) => {
                const flip = idx % 2 === 1;
                return (
                  <li
                    key={item.year}
                    className={`relative grid md:grid-cols-2 gap-6 md:gap-12 items-center pl-12 md:pl-0 ${
                      flip ? 'md:[&>article]:order-2' : ''
                    }`}
                  >
                    {/* Dot */}
                    <span
                      aria-hidden
                      className="absolute left-5 md:left-1/2 top-3 md:top-6 -translate-x-1/2 grid place-items-center w-4 h-4 rounded-full bg-brand-gradient ring-4 ring-white shadow"
                    />
                    <article
                      className={`bg-white rounded-2xl border border-slate-200/70 shadow-card p-6 md:p-7 md:[--side:end] ${
                        flip ? 'md:text-right md:items-end md:flex md:flex-col' : ''
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                        <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                        {item.year}
                      </span>
                      <h3 className="font-display text-xl md:text-2xl font-bold text-ink mt-2">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-ink-muted leading-relaxed">
                        {item.body}
                      </p>
                    </article>
                    {/* Decorative spacer on alternating side (desktop only) */}
                    <div aria-hidden className="hidden md:block" />
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ── VALÈ YO — features-4 shadcn block adapte pou Hoïs ──────────── */}
      <Features />

      {/* ── IMPAK ─────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-ink text-cream-50 overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(22,163,74,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(196,49,120,0.3), transparent 50%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-brand-200 text-sm font-medium mb-4">
              <Globe className="w-3.5 h-3.5" strokeWidth={2.2} />
              Impak nou
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Chif ki rakonte istwa a
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="font-display text-4xl md:text-6xl font-bold text-brand-300 leading-none">
                  {value}
                </div>
                <div className="mt-2 text-sm md:text-base text-white/70">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent/10 border border-brand-100 px-6 py-14 md:px-14 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-brand-700 text-sm font-medium mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
              Vin pati de istwa a
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight max-w-3xl mx-auto">
              Pa rete sou bò wout la — kòmanse vwayaj byennèt ou jodi a
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-ink-muted text-base md:text-lg leading-relaxed">
              Yon pakèt manm ap deja sèvi ak plan Hoïs Inivèsite a. Chwazi pou
              ou a, jwenn yon Ton vye dedye, epi suiv pwogrè w yo nan tèl tan
              reyèl.
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/#pri"
                className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-7 py-3.5 rounded-full font-medium transition shadow-md"
              >
                Wè plan yo
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
              >
                Pale ak yon konseye
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
