import React from 'react';
import { Leaf, Droplet, HeartPulse, Brain, Moon, Sun } from 'lucide-react';

const FEATURES = [
  {
    icon: Leaf,
    title: 'Bon Remèd Natirèl',
    body: 'Plis pase 400 dòz ak fòmil ki sòti dirèkteman nan Medsin Tradisyonèl Ayisyen an, byen dokimante ak bon jan konsèy ekspè plis evidans syantifik',
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: HeartPulse,
    title: 'Swivi Sante Pèsonalize',
    body: 'Anrejistre tansyon w, nivo sik ou, ak pwa w. Dachbòd a ap ede w suiv pwogrè w ak grafik klè chak semèn pou w ka pi byen kontwole sante w.',
    accent: 'bg-rose-100 text-rose-700',
  },
  {
    icon: Brain,
    title: 'Gid Espirityèl',
    body: 'Prezantasyon odyovizyèl, salon, bat bouch VIP, ak konvèsasyon pwofon sou espirityalite, mounite, linivè, egzistans, ak lòt sijè transandantal atravè pakou Hoïs la. Konsiltasyon konfidansyèl pou ede w jwenn plis klète, ekilib, ak byennèt mantal ak espirityèl.',
    accent: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: Droplet,
    title: 'Konsiltasyon Natiropatik',
    body: 'Pwofesyonèl sètifye Hoïs yo evalye malèz ou yo epi gide w ak yon apwòch olistik ki pran an konsiderasyon kò w, lespri w, ak anviwònman w.',
    accent: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Moon,
    title: 'Sèvo & Sante Mantal',
    body: 'Yon espas espesyalize pou sipòte memwa, konsantrasyon, detant ak sante mantal, rezilyans emosyonèl, ak rekiperasyon apre peryòd estrès, fatig mantal, depresyon oswa lòt defi ki afekte byennèt sikolojik.',
    accent: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Sun,
    title: 'Lakou Hoïs',
    body: 'Yon kominote dinamik kote w ap jwenn salon, prezantasyon, ak fòmasyon gratis nan gwoup VIP Hoïs la. Se yon espas kote w ka konekte ak lòt manm ki pataje menm vizyon an epi k ap chèche limyè pou dekouvri ak pi byen konprann sans ak misyon lavi yo.',
    accent: 'bg-amber-100 text-amber-700',
  },
];

export default function FeaturesSection() {
  return (
    <section id="pwodui" className="relative w-full py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        <div className="flex flex-col items-center text-center max-w-[720px] mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
            Sa nou ofri w
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
            Tout sa ou bezwen pou w  <span className="text-brand-600">viv lavi w an sante</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-ink-muted leading-relaxed">
            Yon platfòm konplè ki marye medsin tradisyonèl ayisyen ak teknoloji modèn pou ofri w yon eksperyans byennèt san parèy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map(({ icon: Icon, title, body, accent }) => (
            <div
              key={title}
              className="group relative bg-white rounded-2xl p-7 border border-slate-200/70 hover:border-brand-300 hover:shadow-card card-lift transition-all"
            >
              <span className={`grid place-items-center w-12 h-12 rounded-xl ${accent} mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" strokeWidth={2.2} />
              </span>
              <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
