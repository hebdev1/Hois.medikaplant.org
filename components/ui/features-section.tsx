import React from 'react';
import { Leaf, Droplet, HeartPulse, Brain, Moon, Sun } from 'lucide-react';

const FEATURES = [
  {
    icon: Leaf,
    title: 'Remèd Fèy Otantik',
    body: 'Plis pase 200 fòmil ki soti dirèkteman nan tradisyon medsin Ayisyen, dokimante ak yon konsèy ekspè.',
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: HeartPulse,
    title: 'Swivi Sante Pèsonèl',
    body: 'Anrejistre tansyon w, To sik , ak pwa ou. Dashboard la edew swiv pwogrè ou ak grafik klè chak semèn.',
    accent: 'bg-rose-100 text-rose-700',
  },
  {
    icon: Brain,
    title: 'Mantò Espirityèl',
    body: 'Konvèsasyon pwofon ak Vye Ewòl. Konsiltasyon konfidansyèl pou byennèt lespri ou.',
    accent: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: Droplet,
    title: 'Konsiltasyon Natiropatik',
    body: 'Pwofesyonèl sètifye Hoïs evalye kondisyon ou ak yon apwòch ki konekte kò, lespri, ak anviwònman.',
    accent: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Moon,
    title: 'Sòmèy ak Rekiperasyon',
    body: 'Pwogram odyo pou sòmèy pwofon ak meditasyon binoral — adapte pou diferan kondisyon sante.',
    accent: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Sun,
    title: 'Kominote Vivan',
    body: 'Salon, prezantasyon, fòmasyon gratis nan gwoup Hoïs VIP. Konekte ak lòt manm ki gen menm vizyon ak ou.',
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
            Tout sa ou bezwen pou yon <span className="text-brand-600">vi an sante</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-ink-muted leading-relaxed">
            Yon platfòm konplè ki kominike medsin tradisyonèl ayisyen ak teknoloji modèn pou ba ou yon eksperyans byennèt san parèy.
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
