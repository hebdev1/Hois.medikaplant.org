import Image from 'next/image';
import { Quote } from 'lucide-react';

type Testimonial = {
  name: string;
  city: string;
  plan: string;
  body: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie Lourdes',
    city: 'Pòtoprens',
    plan: 'Hoïs Melis · VIP',
    body: 'Konsiltasyon 21 minit ak Vye Ewòl chanje fason mwen wè byennèt. Mwen jwenn balans nan kò ak lespri m.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Jean Robert',
    city: 'Kap Ayisyen',
    plan: 'Hoïs Sitwonèl',
    body: 'Aksè davans sou kontni an se yon trezò. Apre 6 mwa, tansyon m estabilize ak swivi pèsonèl la.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Nadine Pierre',
    city: 'Miami',
    plan: 'Hoïs Bazilik',
    body: 'Mwen pase twòp tan nan dyaspora a. Hoïs konekte m ak rasin mwen remèd fèy yo travay jan sa dwe fèt.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative w-full py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        <div className="flex flex-col items-center text-center max-w-[680px] mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
            Temwayaj
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
            Sa manm yo <span className="text-brand-600"> di </span> sou Hoïs
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="relative bg-white rounded-2xl p-7 border border-slate-200/70 shadow-card card-lift"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-brand-200" strokeWidth={1.8} />
              <p className="text-ink/85 text-sm md:text-base leading-relaxed">
                &ldquo;{t.body}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-slate-100">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-brand-100">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{t.name}</p>
                  <p className="text-xs text-ink-muted">{t.city} · {t.plan}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
