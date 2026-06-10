import Image from 'next/image';
import { Leaf, Heart, Globe } from 'lucide-react';

const PILLARS = [
  {
    icon: Leaf,
    title: 'Tradisyon & Syans',
    body: 'yon patrimwàn nou dwe transmèt de jenerasyon an jenerasyon. Nou mete ansanm rechèch syantifik ak medsin tradisyonèl pou ofri yon apwòch ki chita sou konesans ak eksperyans.',
  },
  {
    icon: Heart,
    title: 'Bonjan Swen',
    body: 'Yon apwòch olistik ki pran an konsiderasyon kò w, lespri w, ak nanm ou pou ankouraje yon byennèt ki pi konplè.',
  },
  {
    icon: Globe,
    title: 'Kominote',
    body: "Yon rezo manm solid ki sipòte youn lòt, pataje konesans, epi grandi ansanm atravè lemond anjeneral, patikilyèman an Ayiti ak dyaspora ayisyen an.",
  },
];

export default function AboutSection() {
  return (
    <section id="istwa" className="relative w-full py-24 md:py-32 bg-gradient-to-b from-brand-50/40 to-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT — image collage */}
          <div className="relative">
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=80"
                alt="Tradisyon natiropatik Ayisyen"
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="hidden md:block absolute -bottom-10 -right-6 w-56 h-56 rounded-2xl overflow-hidden shadow-card border-4 border-white">
              <Image
                src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80"
                alt="Fèy ak plant"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
            <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-card px-5 py-4 flex items-center gap-3">
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-gradient text-white">
                <Leaf className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs text-ink-muted">Depi</p>
                <p className="text-lg font-bold text-ink leading-tight">2018</p>
              </div>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
              Sou Hoïs Inivèsite
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Yon pon ant <span className="text-brand-600">tradisyon</span> ak modènite
            </h2>
            <p className="mt-5 text-ink-muted text-base md:text-lg leading-relaxed">
             Hoïs Inivèsite se yon inisyativ Medikaplant ki fèt pou prezève, valorize, epi pataje konesans medsin tradisyonèl ayisyen an. Nou mete ansanm sajès zansèt yo ak zouti modèn pou edike, akonpaye, epi ede chak manm suiv pwogrè yo nan vwayaj byennèt, devlopman pèsonèl, ak sante olistik yo.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-slate-200/70 p-5 hover:border-brand-300 transition-colors">
                  <Icon className="w-6 h-6 text-brand-600 mb-3" strokeWidth={2.2} />
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs text-ink-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
