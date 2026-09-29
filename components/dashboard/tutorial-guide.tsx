'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  FolderOpen,
  FlaskConical,
  GraduationCap,
  BookOpen,
  Leaf,
  Sprout,
  Download,
  MessagesSquare,
  Award,
  Crown,
  LifeBuoy,
  UserCircle,
  Compass,
  PlayCircle,
  Lightbulb,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

// Detailed, written "how to use the platform" guide shown at /dashboard/tutorial.
// Read-mode help surface: an accordion of member sections you click to expand
// for the full step-by-step. Static content, no data fetch. Re-themed to the
// MedikaPlant system (Playfair display, forest/gold/cream/ink) and animated
// with the project's `motion` lib; motion is disabled under reduced-motion.

type GuideItem = {
  icon: LucideIcon;
  title: string;
  what: string;
  steps: string[];
  tip?: string;
  tone?: 'forest' | 'gold';
};

const SECTIONS: { heading: string; items: GuideItem[] }[] = [
  {
    heading: 'Kòmanse',
    items: [
      {
        icon: LayoutDashboard,
        title: 'Tablodebò',
        what: 'Se premye paj ou wè lè ou konekte. Li rasanble tout sa ki enpòtan pou jou a nan yon sèl kote, epi li chanje selon plan ou ak objektif sante w.',
        steps: [
          'Anlè paj la, w ap jwenn konsèy plant jou a — yon ti konsèy sante ki chanje chak jou. Li li pou kòmanse jounen w.',
          'Nan lis "tach pou jou a", chak tach gen yon ti kaz. Klike kaz la lè ou fè tach la — pousantaj pwogrè jou a ap monte otomatikman.',
          'Sekans (streak) ou montre konbyen jou youn apre lòt ou rete aktif. Konekte epi fè omwen yon tach chak jou pou kenbe l.',
          'Pi ba, w ap jwenn badj ou yo, grafik swivi sante w, ak sijesyon remèd dapre kondisyon w.',
        ],
        tip: 'Si w fèk enskri, ranpli pwofil ou (kondisyon + objektif sante) pou tablodebò a vin fèt espesyalman pou ou.',
        tone: 'forest',
      },
      {
        icon: Sparkles,
        title: 'Lakou Limyè',
        what: 'Se espas espirityèl Hoïs la — kote ou jwenn ansèyman, emisyon, ak refleksyon pou nouri chemen limyè w. Kontni an ranje nan plizyè tab.',
        steps: [
          'Anlè paj la, chwazi yon tab (pa egzanp Salon mistik, Emisyon spirityèl, oswa Pakou limyè).',
          'Pou yon videyo oswa yon odyo, klike sou li pou l jwe dirèkteman nan paj la.',
          'Pou yon atik, klike sou li pou li tout tèks la.',
          'Tounen souvan: ekip la ka ajoute nouvo tab ak nouvo kontni nenpòt lè.',
        ],
        tone: 'gold',
      },
    ],
  },
  {
    heading: 'Sante',
    items: [
      {
        icon: Activity,
        title: 'Swivi Sante',
        what: 'Se kaye sante dijital ou. Ou note chif ou yo (sik nan san, tansyon, pwa) epi platfòm nan montre w evolisyon yo sou grafik pou w wè si w ap amelyore.',
        steps: [
          'Klike bouton "Ajoute" a pou antre yon nouvo mezi.',
          'Chwazi kalite mezi a (sik, tansyon, oswa pwa), antre valè a ak dat la, epi anrejistre.',
          'Grafik yo mete ajou otomatikman — w ap wè liy evolisyon w nan tan.',
          'Antre valè yo chak jou (oswa chak fwa ou mezire) pou grafik la ba w yon vrè imaj.',
        ],
        tip: 'Pi plis ou note regilyèman, se pi bon konsèy ekip la ka ba ou sou sante w.',
      },
      {
        icon: FolderOpen,
        title: 'Pwotokòl mwen yo',
        what: 'Se plan swen pèsonalize yo bati pou ou selon kondisyon w. Chak pwotokòl gen tach pa jou pou w swiv sou plizyè jou.',
        steps: [
          'Louvri pwotokòl aktif ou a.',
          'W ap wè tach ki koresponn ak jou ou ye a nan pwotokòl la — swiv chak etap.',
          'Make chak tach fèt lè w fin fè l.',
          'Kontinye chak jou; pwotokòl la ap avanse youn apre lòt jiskaske li fini.',
        ],
        tip: 'Tach yo parèt dapre jou ou nan pwotokòl la — eseye pa sote jou pou w jwenn tout benefis la.',
      },
      {
        icon: FlaskConical,
        title: 'Resèt ak Dòz',
        what: 'Se bibliyotèk resèt plant yo ak enfòmasyon sou dòz — ki kantite pou pran ak konbyen fwa.',
        steps: [
          'Chwazi yon resèt pou wè engredyan yo ak jan pou prepare l.',
          'Swiv dòz ki endike a — pa depase l.',
          'Make chak dòz ou pran pou swiv fidèlite w ap swiv tretman an.',
        ],
        tip: 'Toujou respekte dòz la. Si w gen dout, mande ekip sipò a anvan ou pran plis.',
      },
    ],
  },
  {
    heading: 'Aprann',
    items: [
      {
        icon: GraduationCap,
        title: 'Klas mwen yo',
        what: 'Se kote fòmasyon (kou) ou enskri yo ye — videyo, modil, ak sesyon Zoom an dirèk.',
        steps: [
          'Louvri yon kou pou wè lis modil li yo.',
          'Klike yon modil pou gade videyo a; pwogrè w sove otomatikman pou ou ka kontinye pita.',
          'Pou kou ki gen sesyon an dirèk, w ap jwenn yon lyen Zoom pèsonèl — klike l lè lè sesyon an rive.',
          'Gen kou ki gratis ak plan ou; lòt yo mande yon acha anvan ou ka wè yo.',
        ],
        tip: 'Kite yon modil louvri jiskaske li make "fèt" pou pwogrè w byen konte.',
      },
      {
        icon: BookOpen,
        title: 'Gid & Konsèy',
        what: 'Yon bibliyotèk atik konplè sou plant Ayisyen yo, fason pou prepare yo, ak jan yo ka entèraji ak medikaman.',
        steps: [
          'Chèche pa sijè oswa pa non plant.',
          'Louvri yon gid pou li tout enfòmasyon an an detay.',
          'Aplike konsèy yo nan swen chak jou w.',
        ],
        tip: 'Sèvi ak gid sa yo ansanm ak pwotokòl ou pou pi bon rezilta.',
      },
      {
        icon: Leaf,
        title: 'Glosè plant',
        what: 'Yon diksyonè plant medisinal Ayisyen — chak plant gen non li, pwopriyete l, ak prekosyon pou itilize l.',
        steps: [
          'Chèche yon plant pa non (an Kreyòl oswa non syantifik la).',
          'Li pwopriyete plant lan ak prekosyon yo.',
          'Sèvi ak enfòmasyon sa a anvan ou itilize yon plant ou pa konnen.',
        ],
        tip: 'Toujou li prekosyon yo — kèk plant pa bon pou fanm ansent oswa lè w ap pran sèten medikaman.',
      },
      {
        icon: Sprout,
        title: 'Laboratwa',
        what: 'Yon achiv rechèch ki lye maladi ak remèd plant — yon zouti pou eksplore epi konprann konesans tradisyonèl la.',
        steps: [
          'Eksplore pa maladi/kondisyon oswa pa plant.',
          'Louvri yon fich pou wè detay yo (remèd, preparasyon, elatriye).',
          'Sèvi ak zouti konparezon ak eksplorasyon yo pou aprann plis.',
        ],
      },
      {
        icon: Download,
        title: 'Telechajman',
        what: 'Kote ou jwenn resous pou telechaje: gid PDF, dokiman, ak lòt materyèl itil.',
        steps: [
          'Gade lis resous ki disponib yo.',
          'Klike sou yon resous pou telechaje l sou aparèy ou.',
        ],
      },
    ],
  },
  {
    heading: 'Kominote & Sipò',
    items: [
      {
        icon: MessagesSquare,
        title: 'Fowòm',
        what: 'Espas kominote a — pataje eksperyans ou, poze kesyon, epi konekte ak lòt manm ki sou menm chemen an ak ou.',
        steps: [
          'Louvri yon sijè ki egziste deja, oswa kreye yon nouvo sijè pa w.',
          'Ekri repons ou epi bay lòt moun konsèy oswa ankourajman.',
          'Rete respektye: se yon espas pou youn ede lòt.',
        ],
      },
      {
        icon: Award,
        title: 'Badj mwen yo',
        what: 'Rekonpans ou genyen pandan w ap itilize platfòm nan — yo make pwogrè w epi ankouraje w kontinye.',
        steps: [
          'Wè badj ou deja debloke yo.',
          'Wè sa ki rete pou w genyen ak sa pou w fè pou debloke yo.',
        ],
      },
      {
        icon: Crown,
        title: 'Espas VIP',
        what: 'Kontni ak avantaj espesyal ki rezève pou manm VIP yo.',
        steps: ['Louvri espas la pou wè avantaj ki vin ak plan w lan.'],
        tip: 'Si w poko VIP, w ap wè ki avantaj ou ka jwenn si w monte plan ou.',
        tone: 'gold',
      },
      {
        icon: LifeBuoy,
        title: 'Sipò',
        what: 'Chat dirèk ak ekip Hoïs la. Se la ou poze kesyon epi jwenn èd rapid lè ou bezwen l.',
        steps: [
          'Ekri mesaj ou epi voye l. Anlè chat la, ou wè si ekip la "An liy" oswa lè y ap tounen.',
          'Klike bouton agraf la pou voye yon foto oswa yon fichye (PDF, dokiman, elatriye).',
          'Pase sou pwòp mesaj ou pou modifye l oswa efase l.',
          'W ap resevwa yon repons, epi yon notifikasyon nan kloch la lè ekip la reponn ou.',
        ],
        tip: 'Pou yon bagay prese, tcheke lè disponiblite ekip la ki make anlè chat la.',
        tone: 'forest',
      },
      {
        icon: UserCircle,
        title: 'Kont mwen',
        what: 'Kote ou jere pwofil ou, plan ou, ak jan platfòm nan parèt pou ou.',
        steps: [
          'Mete oswa chanje foto ak enfòmasyon pèsonèl ou.',
          'Nan "Aparans", chanje mòd fonse, koulè, ak gwosè tèks pou konfò w.',
          'Jere plan/abònman ou.',
          'Ou ka rejwe titoryèl rapid la (vizit gide a) nenpòt lè depi la.',
        ],
      },
    ],
  },
];

export default function TutorialGuide() {
  // Single-open accordion (FAQ-style). First item open by default.
  const [openKey, setOpenKey] = React.useState<string | null>(
    SECTIONS[0].items[0].title
  );

  return (
    <div className="max-w-[820px] animate-fadeUp">
      {/* Intro */}
      <header className="relative overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
        <div
          className="pointer-events-none absolute inset-0 leaf-grid opacity-60"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(101,136,26,0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-12 h-56 w-56 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(231,142,23,0.14), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative p-6 md:p-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-4 dark:bg-forest-900/60 dark:text-forest-200">
            <Compass className="w-3.5 h-3.5" strokeWidth={2.2} />
            Titoryèl
          </div>
          <h1 className="font-display text-3xl md:text-[2.75rem] md:leading-[1.05] font-bold tracking-tight text-ink">
            Kijan pou itilize platfòm nan
          </h1>
          <p className="mt-3 text-sm md:text-base text-earth-600 max-w-xl leading-relaxed">
            Men yon gid detaye sou chak pati nan Hoïs. Klike sou yon seksyon pou
            louvri l epi wè etap pa etap yo. Ou ka tounen isit la nenpòt lè.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard?tour=1"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#15132a]"
            >
              <PlayCircle
                className="w-4 h-4 transition-transform group-hover:scale-110"
                strokeWidth={2.2}
              />
              Fè yon vizit gide rapid
            </Link>
          </div>
        </div>
      </header>

      {/* Accordion sections */}
      <div className="mt-4">
        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-9 first:mt-8">
            <div className="mb-4 flex items-center gap-3 px-1">
              <h2 className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.14em] text-forest-700 dark:text-forest-300">
                {section.heading}
              </h2>
              <span className="h-px flex-1 bg-cream-200" aria-hidden />
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <AccordionCard
                  key={item.title}
                  item={item}
                  open={openKey === item.title}
                  onToggle={() =>
                    setOpenKey((k) => (k === item.title ? null : item.title))
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AccordionCard({
  item,
  open,
  onToggle,
}: {
  item: GuideItem;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  const gold = item.tone === 'gold';
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white shadow-card overflow-hidden transition-colors',
        open
          ? 'border-forest-200 dark:border-forest-800'
          : 'border-cream-200'
      )}
    >
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        whileHover={reduce ? undefined : { x: 2 }}
        className="flex w-full items-center gap-3.5 px-4 md:px-5 py-4 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
      >
        <span
          className={cn(
            'grid place-items-center w-11 h-11 rounded-xl shrink-0',
            gold
              ? 'bg-gold-100 text-gold-700'
              : 'bg-forest-100 text-forest-700'
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display text-base font-bold text-ink">
            {item.title}
          </span>
          {!open && (
            <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-earth-600">
              {item.what}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 text-earth-500"
          aria-hidden
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reduce ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="px-4 md:px-5 pb-5">
              <div className="border-t border-cream-200 pt-4">
                <p className="text-sm leading-relaxed text-earth-700">
                  {item.what}
                </p>

                <p className="mt-4 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-earth-500">
                  Etap pa etap
                </p>
                <ol className="space-y-2.5">
                  {item.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className={cn(
                          'grid place-items-center w-5 h-5 shrink-0 rounded-full text-[11px] font-bold mt-0.5',
                          gold
                            ? 'bg-gold-100 text-gold-700'
                            : 'bg-forest-100 text-forest-700'
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-earth-700">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                {item.tip && (
                  <div
                    className={cn(
                      'mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5',
                      gold
                        ? 'bg-gold-50 border-gold-100 dark:bg-gold-700/15 dark:border-gold-700/40'
                        : 'bg-forest-50 border-forest-100 dark:bg-forest-900/40 dark:border-forest-800/60'
                    )}
                  >
                    <Lightbulb
                      className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        gold
                          ? 'text-gold-600 dark:text-gold-300'
                          : 'text-forest-600 dark:text-forest-300'
                      )}
                      strokeWidth={2}
                    />
                    <p
                      className={cn(
                        'text-[13px] leading-relaxed',
                        gold
                          ? 'text-gold-700 dark:text-gold-200'
                          : 'text-forest-800 dark:text-forest-100'
                      )}
                    >
                      {item.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
