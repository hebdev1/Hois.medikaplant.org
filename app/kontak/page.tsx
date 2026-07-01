import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Sparkles,
  HelpCircle,
  Leaf,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import ContactForm from './contact-form';

export const metadata = {
  title: 'Kontak · MedikaPlant Hoïs Inivèsite',
  description:
    'Kontakte ekip sipò Hoïs MedikaPlant Inivèsite pou patenarya, oswa konsiltasyon sou plant elatriye...',
};
// Force dynamic — the form posts to a server action that reads cookies
// (to attach the optional user_id). Static pre-rendering tries to run
// the action context at build time and times out.
export const dynamic = 'force-dynamic';

const CHANNELS = [
  {
    icon: Mail,
    label: 'Imèl',
    value: 'plant@medikaplant.org',
    href: 'mailto:plant@medikaplant.org',
    tone: 'bg-brand-50 text-brand-700',
  },
  {
    icon: Phone,
    label: 'Telefòn / WhatsApp',
    value: '+1 954 569 0705',
    href: 'tel:+19545690705',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    icon: MapPin,
    label: 'Adrès',
    value: '1823 S. DIXIE HIGHWAY POMPANO BEACH, FL 33060',
    href: 'https://www.google.com/maps/search/?api=1&query=1823+S+Dixie+Highway+Pompano+Beach+FL+33060',
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    icon: Clock,
    label: 'Lè',
    value: 'Lendi → Vandredi · 8h–17h',
    href: null,
    tone: 'bg-sky-50 text-sky-700',
  },
];

const FAQS = const faqs = [
  {
    q: 'Kisa HOÏS MedikaPlant ye?',
    a: 'HOÏS MedikaPlant se platfòm edikatif kote manm yo jwenn fòmasyon, videyo, dokiman, atelye ak lòt resous pou aprann sou Medsin Tradisyonèl Ayisyen, syans plant ak byennèt.'
  },
  {
    q: 'Kijan mwen vin manm?',
    a: 'pou kreye Kreye yon kont sou HOÏS MedikaPlant, chwazi plan ki enterese w la epi finalize enskripsyon w.'
  },
  {
    q: 'Mwen bliye modpas mwen. Kisa pou m fè?',
    a: 'Klike sou "Bliye modpas" sou paj koneksyon an epi swiv etap yo pou kreye yon nouvo modpas.'
  },
  {
    q: 'Èske mwen ka suiv kou yo sou telefòn?',
    a: 'Wi. Ou ka itilize HOÏS MedikaPlant sou telefòn, tablèt oswa òdinatè.'
  },
  {
    q: 'Èske m ap resevwa aksè tousuit apre peman?',
    a: 'Wi, aksè a aktive otomatikman tousuit apre peman an konfime.'
  },
  {
    q: 'Kijan pou m pran yon konsiltasyon?',
    a: 'Klike sou "Mande yon konsiltasyon". Yon Gid ap kontakte w pou pwograme randevou w. Tout konsiltasyon fèt sou Zoom.'
  },
  {
    q: 'Èske konsiltasyon yo gratis?',
    a: 'Non. Konsiltasyon yo se yon sèvis separe ki mande randevou ak peman davans.'
  },
  {
    q: 'Èske m ka voye kesyon sou sante m?',
    a: 'Wi. Dekri sitiyasyon w ak tout detay ki enpòtan pou ekip la ka pi byen evalye bezwen w.'
  },
  {
    q: 'Konbyen tan li pran pou nou reponn?',
    a: 'Nou fè tout efò pou reponn mesaj yo nan mwens pase 24 èdtan pandan lè sèvis yo.'
  },
  {
    q: 'Poukisa mwen poko jwenn repons?',
    a: 'Nou trete mesaj yo youn apre lòt. Si gen anpil demann, sa ka pran plis tan. Nou apresye pasyans ou.'
  },
  {
    q: 'Èske mwen ka rele Vye Ewòl dirèkteman?',
    a: 'Non. Tout demann pase atravè sistèm HOÏS MedikaPlant. Sa pèmèt nou sèvi tout moun nan yon fason òganize ak jis.'
  },
  {
    q: 'Èske Vye Ewòl reponn tout mesaj yo?',
    a: 'Non. Gen yon ekip Gid ki trete mesaj yo. Vye Ewòl patisipe nan konsiltasyon, fòmasyon ak lòt sèvis ki mande prezans li.'
  },
  {
    q: 'Kijan mwen mete ajou enfòmasyon kont mwen?',
    a: 'Ale nan Paramèt Kont ou pou modifye non, imèl, modpas ak lòt enfòmasyon pèsonèl.'
  },
  {
    q: 'Èske mwen ka anile abònman mwen?',
    a: 'Wi. Ou ka jere oswa anile abònman w selon kondisyon plan ou a depi nan kont ou.'
  },
  {
    q: 'Kijan pou m rapòte yon pwoblèm teknik?',
    a: 'Sèvi ak fòm sipò a oswa chat sipò ki nan kont ou epi eksplike pwoblèm nan ak tout detay ki enpòtan.'
  },
  {
    q: 'Èske enfòmasyon mwen yo rete konfidansyèl?',
    a: 'Wi. Nou respekte vi prive manm nou yo epi nou trete enfòmasyon yo avèk konfidansyalite.'
  },
  {
    q: 'Èske HOÏS MedikaPlant vann pwodwi?',
    a: 'Pwodwi Medikaplant yo disponib sou MedikaplantShop.com. HOÏS MedikaPlant se platfòm edikasyon ak sèvis pou manm yo.'
  },
  {
    q: 'Kijan pou m jwenn plis èd?',
    a: 'Ou ka itilize seksyon Sipò a oswa voye yon mesaj atravè kont ou. Ekip nou an ap ede w pi vit posib.'
  }
];

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/medikaplant/?locale=fr_FR',
    Icon: Facebook,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/medikaplant/',
    Icon: Instagram,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@medikaplant',
    Icon: Youtube,
  },
];

export default function KontakPage() {
  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 15%, rgba(22,163,74,0.10), transparent 45%), radial-gradient(circle at 15% 85%, rgba(196,49,120,0.08), transparent 40%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-5">
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kontak
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
              N ap koute w {' '}
              <span className="text-brand-600">ekri nou</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
              Yon kesyon sou yon plant, sou kont ou, oswa yon pwopozisyon
              patenarya? Voye mesaj la a  yon manb nan ekip la ap reponn ou
              nan mwens ke 24 èdtan.
            </p>
          </div>
        </div>
      </section>

      {/* ── CONTACT METHODS GRID ─────────────────────────────────────────── */}
      <section className="py-12 md:py-16 -mt-6 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {CHANNELS.map(({ icon: Icon, label, value, href, tone }) => {
              const inner = (
                <>
                  <span
                    className={`grid place-items-center w-11 h-11 rounded-xl ${tone} shrink-0`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      {label}
                    </div>
                    <div className="text-sm md:text-[15px] font-semibold text-ink mt-0.5 truncate">
                      {value}
                    </div>
                  </div>
                </>
              );

              const wrapper =
                'flex items-center gap-3 bg-white rounded-2xl border border-slate-200/70 shadow-card p-4 md:p-5 hover:border-brand-300 hover:shadow-lg transition-all';
              return href ? (
                <a key={label} href={href} className={wrapper}>
                  {inner}
                </a>
              ) : (
                <div key={label} className={wrapper}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FORM + RAIL ───────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-start">
            {/* LEFT — Form */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
                Voye mesaj ou
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">
                Yon fòm, yon repons,{' '}
                <span className="text-brand-600">pa gen pèdi tan</span>
              </h2>
              <p className="mt-4 text-ink-muted leading-relaxed max-w-xl">
                Plis ou byen eksplike sa w bezwen an, se pi rapid ekip nou an ap ka voye yon repons konplè ba ou. 
                Ranpli tout kazye yo ki gen ti etwal obligatwa a. <span className="text-rose-600">*</span>{' '}
                obligatwa.
              </p>

              <ContactForm />
            </div>

            {/* RIGHT — Side rail */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              {/* Live-help card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-ink to-[#1a1052] text-cream-50 p-6 md:p-7 overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand-500/30 blur-2xl"
                />
                <Leaf className="w-7 h-7 text-brand-300 relative" strokeWidth={2.2} />
                <h3 className="relative mt-4 font-display text-xl md:text-2xl font-bold leading-tight">
                  Ou deja manb? Itilize chat sipò a
                </h3>
                <p className="relative mt-2 text-sm text-white/75 leading-relaxed">
                  Kontakte nou pa imèl yon manb nan ekip nou an ap ede w epi n ap reponn ou pi vit posib, 
                  oubyen kreye kont pouw gen yon asistans rapid.
                </p>
                <Link
                  href="/dashboard/support"
                  className="relative mt-5 inline-flex items-center gap-2 bg-white text-ink px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-50 transition"
                >
                  Ouvè chat sipò
                </Link>
              </div>

              {/* Address card */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 md:p-7 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white shrink-0">
                    <MapPin className="w-4 h-4" strokeWidth={2.4} />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Etazini
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink mt-1">
                      Biwo prensipal
                    </h3>
                    <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
                      1823 S. DIXIE HIGHWAY POMPANO BEACH, FL 33060
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      Lendi → Vandredi · 8h – 17h
                    </p>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-brand-50/40 p-6 md:p-7">
                <h3 className="font-display text-lg font-bold text-ink">
                  Swiv nou sou rezo sosyal yo
                </h3>
                <p className="text-sm text-ink-muted mt-2">
                  Nouvèl plant chak semèn + videyo konsèy.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {SOCIALS.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="grid place-items-center w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-700 text-ink-muted transition"
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/30">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
              <HelpCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
              Kesyon rapid
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Repons rapid
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

      <Footer />
    </main>
  );
}
