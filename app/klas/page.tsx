import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Leaf,
  Stethoscope,
  Sparkles,
  Activity,
  Sprout,
  Heart,
  Clock,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Star,
  Video,
  Mountain,
} from 'lucide-react';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';

export const metadata = {
  title: 'Klas · MedikaPlant Hoïs Inivèsite',
  description:
    'Katalòg klas Hoïs Inivèsite — plant santiniye, espiritualite HOÏS, nitrisyon, lavi natiropatik. Aprann ak yon èrboris.',
};

const CATEGORIES = [
  {
    slug: 'plant-santiniye',
    title: 'Plant Santiniye',
    body:
      'Idantifye, prepare, ak itilize plant ki te toujou geri an Ayiti.',
    icon: Leaf,
    tone: 'from-brand-500 to-brand-700',
    classes: 18,
  },
  {
    slug: 'hois',
    title: 'Espiritualite HOÏS',
    body:
      'Aprann pilye HOÏS yo: konekte ak Granmèt, mistik fèy yo, ak gerizon nanm.',
    icon: Mountain,
    tone: 'from-accent to-rose-700',
    classes: 12,
  },
  {
    slug: 'nitrisyon',
    title: 'Nitrisyon Natiropatik',
    body:
      'Manje pou jere dyabèt, tansyon, ak kondisyon kronik ak pwodwi natirèl.',
    icon: Sprout,
    tone: 'from-amber-500 to-amber-700',
    classes: 9,
  },
  {
    slug: 'lavi-natiropatik',
    title: 'Lavi Natiropatik',
    body:
      'Abitid lavi, jèn, dòmi, ak abitid byennèt ki ranfòse defans natirèl ou.',
    icon: Activity,
    tone: 'from-sky-500 to-sky-700',
    classes: 7,
  },
  {
    slug: 'gerizon-emosyonèl',
    title: 'Gerizon Emosyonèl',
    body:
      'Plant + pratik pou anxiyete, depresyon, somèy, ak ekilib kè.',
    icon: Heart,
    tone: 'from-rose-500 to-rose-700',
    classes: 6,
  },
  {
    slug: 'fòmasyon-èrboris',
    title: 'Fòmasyon Èrboris',
    body:
      'Pwogram pwofesyonèl pou moun ki vle pratike kòm èrboris santiniye sètifye.',
    icon: GraduationCap,
    tone: 'from-indigo-500 to-indigo-700',
    classes: 4,
  },
];

const FEATURED = [
  {
    title: 'Idantifye 12 plant santiniye Ayisyen',
    description:
      'Aprann jwenn, idantifye, ak prepare 12 plant ki pi enpòtan nan tradisyon natiropatik nou: Mountain Bwa, Bazilik, Lèt-Lèt, Sitwonèl, eltr.',
    instructor: 'Mèt Joseph Brutus',
    role: 'Èrboris santiniye',
    duration: '6 èdtan · 4 modil',
    level: 'Debutan',
    students: '2,400+',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=80',
    tags: ['Plant santiniye', 'Idantifikasyon'],
    href: '/checkout?plan=premium',
  },
  {
    title: 'Pilye HOÏS — Konekte ak Granmèt',
    description:
      "Yon vwayaj nan 5 pilye HOÏS: limyè, mistik, gerizon kè, kominote, ak konvèsasyon avè'l. Ekspriyans transformatif.",
    instructor: 'Manm fondatè Hoïs',
    role: 'Pratisyen HOÏS',
    duration: '10 èdtan · 5 modil',
    level: 'Tout nivo',
    students: '1,800+',
    rating: 5.0,
    image:
      'https://images.unsplash.com/photo-1545486332-9e0999c535b2?auto=format&fit=crop&w=900&q=80',
    tags: ['HOÏS', 'Espiritualite'],
    href: '/checkout?plan=vip',
  },
  {
    title: 'Manje pou Jere Dyabèt san medikaman',
    description:
      'Pwogram pratik 30 jou ak yon plan manje, tizan, ak abitid pou stabilize sik nan san ou ak metòd natiropatik.',
    instructor: 'Dr. Yvelyne Pierre',
    role: 'Doktè + nitrisyonis',
    duration: '8 èdtan · 6 modil',
    level: 'Entèmedyè',
    students: '3,200+',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80',
    tags: ['Nitrisyon', 'Dyabèt'],
    href: '/checkout?plan=premium',
  },
];

const FORMATS = [
  {
    title: 'Videyo nan tan ou',
    body: 'Aksè total a tout klas yo — gade nan ritm pa w, sou òdinatè oswa telefòn.',
    Icon: Video,
  },
  {
    title: 'Materyèl ki telechaje',
    body: 'PDF, gid, ak fichye odyo ki la pou tout tan menm si ou pa konekte.',
    Icon: BookOpen,
  },
  {
    title: 'Sesyon an direkt',
    body: 'Konsiltasyon ak èrboris VIP, fowòm ak lòt manm, kesyon-repons.',
    Icon: Users,
  },
];

const FAQS = [
  {
    q: 'Èske mwen ka aprann san sètifika?',
    a: 'Wi — chak klas vin ak yon sètifika otomatik nan fen. Men ou ka pran nenpòt klas san fòk ou pase egzamen.',
  },
  {
    q: 'Konbyen tan mwen genyen pou fini yon klas?',
    a: "Pa gen dat limit. Lè ou abonè, ou gen aksè a tout klas yo pou tout tan ou kenbe abònman an aktif.",
  },
  {
    q: 'Èske gen rabè pou etidyan?',
    a: 'Wi — 20% rabè pou etidyan ki montre yon kat etidyan valid. Kontakte nou nan paj sipò a.',
  },
  {
    q: 'Èske mwen ka aprann an Kreyòl ak Franse?',
    a: 'Tout klas yo disponib an Kreyòl. Pi fò pami yo gen sou-titrè Franse ak tradiksyon dokiman.',
  },
];

const LEVEL_TONE: Record<string, string> = {
  'Debutan': 'bg-brand-100 text-brand-700',
  'Entèmedyè': 'bg-amber-100 text-amber-700',
  'Avanse': 'bg-rose-100 text-rose-700',
  'Tout nivo': 'bg-sky-100 text-sky-700',
};

export default function KlasPage() {
  const totalClasses = CATEGORIES.reduce((acc, c) => acc + c.classes, 0);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(22,163,74,0.10), transparent 45%), radial-gradient(circle at 10% 90%, rgba(196,49,120,0.07), transparent 40%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-5">
                <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.4} />
                Klas Hoïs
              </span>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
                Aprann plant ki <span className="text-brand-600">geri</span>,{' '}
                jan grann nou yo te konnen yo.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
                {totalClasses}+ klas an Kreyòl, sou plant santiniye, espiritualite
                HOÏS, nitrisyon, ak lavi natiropatik. Anseye pa moun ki konn sa yo
                ap pale a.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/#pri"
                  className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-6 py-3 rounded-full font-medium transition shadow-md"
                >
                  Vin manm pou aksè total
                  <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                </Link>
                <a
                  href="#kategori"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
                >
                  Wè kategori yo
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6 flex-wrap">
                <div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-ink">
                    {totalClasses}+
                  </div>
                  <div className="text-xs text-ink-muted">klas an Kreyòl</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-ink">
                    6
                  </div>
                  <div className="text-xs text-ink-muted">kategori prensipal</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-ink">
                    4.9
                  </div>
                  <div className="text-xs text-ink-muted">nòt manm yo bay</div>
                </div>
              </div>
            </div>

            {/* Side mosaic */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] rounded-[1.8rem] overflow-hidden shadow-card">
                <Image
                  src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=700&q=80"
                  alt="Fèy santiniye"
                  fill
                  sizes="500px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 max-w-[250px]">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white shrink-0">
                  <Star className="w-4 h-4 fill-current" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="text-xs text-ink-muted">2,400+ manm aktif</div>
                  <div className="text-sm font-semibold text-ink leading-tight">
                    Yon kominote ki sipòte w
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-2 bg-ink text-cream-50 rounded-2xl shadow-card px-4 py-3">
                <Sparkles className="w-4 h-4 text-brand-300 mb-1" strokeWidth={2.4} />
                <div className="text-xs text-white/70">Nouvo klas chak mwa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KATEGORI YO ────────────────────────────────────────────────── */}
      <section id="kategori" className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kategori
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              6 chemen aprann ki konekte
            </h2>
            <p className="mt-4 text-ink-muted leading-relaxed">
              Chwazi kote w vle kòmanse — ou ka pase yon chemen nan yon lòt
              san pwoblèm. Tout klas yo vini ansanm nan abònman ou.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {CATEGORIES.map(({ slug, title, body, icon: Icon, tone, classes }) => (
              <article
                key={slug}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 md:p-7 hover:border-brand-300 hover:shadow-card transition-all"
              >
                <span
                  className={`grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br ${tone} text-white shadow-sm`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  {body}
                </p>
                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted">
                    {classes} klas
                  </span>
                  <span className="text-xs font-bold text-brand-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Eksplore
                    <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── KLAS VEDÈT YO ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
                Klas vedèt
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                Sa ki popilè kounye a
              </h2>
            </div>
            <Link
              href="/#pri"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Wè tout klas yo
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FEATURED.map((klas) => (
              <article
                key={klas.title}
                className="group rounded-2xl bg-white border border-slate-200/70 overflow-hidden hover:border-brand-300 hover:shadow-card transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={klas.image}
                    alt={klas.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {klas.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-ink"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        LEVEL_TONE[klas.level] ?? 'bg-cream-100 text-earth-700'
                      }`}
                    >
                      {klas.level}
                    </span>
                  </div>
                </div>
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  <h3 className="font-display text-lg font-bold text-ink leading-tight">
                    {klas.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed line-clamp-3">
                    {klas.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-ink-muted gap-2">
                    <div>
                      <div className="font-semibold text-ink">{klas.instructor}</div>
                      <div className="text-[10px]">{klas.role}</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" strokeWidth={0} />
                      <span className="font-bold text-ink">{klas.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={2.2} />
                      {klas.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" strokeWidth={2.2} />
                      {klas.students}
                    </span>
                  </div>
                  <Link
                    href={klas.href}
                    className="mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold bg-ink hover:bg-brand-gradient text-cream-50 transition"
                  >
                    Kòmanse klas la
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FÒMA APRANTISAJ ─────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
                <Video className="w-3.5 h-3.5" strokeWidth={2.4} />
                Fòma
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
                3 fason pou aprann nan ritm pa w
              </h2>
              <p className="mt-4 text-ink-muted leading-relaxed">
                Pa gen yon "bon" fason aprann — gen sèlman fason ki bon pou
                ou. Hoïs Inivèsite konbinen videyo, tèks, ak sesyon an
                direkt pou kreye yon eksperyans konplè.
              </p>
            </div>

            <div className="grid sm:grid-cols-1 gap-4">
              {FORMATS.map(({ title, body, Icon }) => (
                <article
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 md:p-6 hover:border-brand-300 transition-colors"
                >
                  <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                      {body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFIS YO (CHECKLIST) ─────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-ink text-cream-50 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(22,163,74,0.4), transparent 50%), radial-gradient(circle at 75% 75%, rgba(196,49,120,0.3), transparent 50%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-brand-200 text-sm font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
                Sa ou jwenn
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Pa yon klas — yon kominote vivan
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Lè ou abonè, ou pa sèlman jwenn klas — ou jwenn aksè a yon
                kominote, yon èrboris, ak yon rezo sipò ki la chak jou.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                'Aksè iliminmite a tout klas + nouvo klas chak mwa',
                'Sètifika ofisyèl pou chak klas ou fini',
                'Konsiltasyon dirèk ak yon èrboris santiniye (plan Premium+)',
                'Fowòm prive ak lòt manm ki ap aprann menm bagay',
                'Materyèl PDF ak fichye odyo ki telechaje',
                'Sipò pèsonalize nan chat 24/24',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-brand-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </span>
                  <span className="text-white/90 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
              Kesyon yo poze souvan
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Sa w ka bezwen konnen
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-white border border-slate-200/70 p-5 md:p-6 hover:border-brand-300 transition-colors"
              >
                <summary className="flex items-start gap-3 cursor-pointer list-none">
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-100 text-brand-700 shrink-0 mt-0.5">
                    <span className="font-display font-bold text-sm">+</span>
                  </span>
                  <span className="font-semibold text-ink">{item.q}</span>
                </summary>
                <p className="mt-3 pl-10 text-sm text-ink-muted leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent/10 border border-brand-100 px-6 py-14 md:px-14 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-brand-700 text-sm font-medium mb-5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kòmanse jodi a
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight max-w-3xl mx-auto">
              Premye klas la ka chanje fason ou wè sante w
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-ink-muted text-base md:text-lg leading-relaxed">
              Chwazi yon plan, jwenn aksè a tout klas yo, epi konekte ak yon
              èrboris kounye a. Pa gen angajman long — ou ka anile nenpòt lè.
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
