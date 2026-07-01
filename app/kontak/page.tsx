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

const FAQS = [
  {
    q: 'Konbyen tan li pran pou nou reponn?',
    a: 'Pi souvan, mwens ke 24 èdtan pandan jou travay yo (Lendi–Vandredi). Mesaj ki rive nan wikenn oswa jou ferye ap resevwa yon repons nan pwochèn jou travay la.',
  },
  {
    q: 'Ki kanal ki pi rapid pou jwenn èd?',
    a: 'Si w deja gen yon kont, chat sipò a nan panel manm ou (Kont mwen → Sipò) se pi rapid — mesaj ou rive dirèkteman nan ekip la. Fòm ki sou paj sa a se pou vizitè ki poko manm, oswa pou kesyon jeneral.',
  },
  {
    q: 'Èske mwen bezwen yon kont pou voye yon mesaj?',
    a: 'Non. Ou ka voye yon mesaj san kreye yon kont. Men si w deja konekte, n ap gen plis kontèks (plan ou, istwa sipò w) pou reponn ou pi vit ak pi presi.',
  },
  {
    q: 'Ki enfòmasyon pou m mete pou jwenn repons pi rapid?',
    a: 'Bay non ou, imèl kote pou nou reponn, epi eksplike sitiyasyon w klèman. Si se yon pwoblèm teknik, mete non navigatè w ak sa ki t ap pase avan pwoblèm nan parèt. Si se yon kesyon konsiltasyon, mete plan ou ak preferans dat.',
  },
  {
    q: 'Kesyon m nan se sou kont oswa sante m. Kote pou m ale?',
    a: 'Konekte sou kont ou, epi ale nan "Kont mwen → Sipò" pou kesyon administratif (fakti, chanjman plan, modpas). Pou kesyon medikal, ale nan "Sante" epi mande yon konsiltasyon — yon Gid ap kontakte w pou pwograme yon randevou Zoom.',
  },
  {
    q: 'Èske mesaj m nan rete konfidansyèl?',
    a: 'Wi. Sèl ekip sipò w otorize ki li mesaj ou. Nou pa vann, ni pataje enfòmasyon pèsonèl ou ak tyès pati. Pou plis detay, gade Politik Konfidansyalite nou an.',
  },
  {
    q: 'Èske m ka jwenn èd an Kreyòl, Franse, oswa Angle?',
    a: 'Wi. Ekip nou an sèvi manm nan Kreyòl, Franse, ak Angle. Ekri nou nan lang ki pi konfòtab pou ou — n ap reponn nan menm lang lan.',
  },
  {
    q: 'Sa pou m fè si mesaj mwen an ijan?',
    a: 'Pou yon ijans medikal, kontakte sèvis lokal ijans nan zòn ou (911, HUEH nan Pòtoprens, elatriye) — HOÏS pa yon sèvis ijans medikal. Pou lòt bagay ijan (aksè kont bloke, pwoblèm peman), make mesaj ou ak "URGENT" nan sijè a epi nou pran l pi vit.',
  },
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
