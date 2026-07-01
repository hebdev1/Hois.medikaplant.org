import Link from 'next/link';
import {
  Shield,
  Lock,
  Database,
  Cookie,
  Globe,
  Eye,
  Trash2,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';

export const metadata = {
  title: 'Konfidansyalite · Hoïs Inivèsite',
  description:
    'Nan HOÏS Inivèsite, nou pran pwoteksyon enfòmasyon pèsonèl ou trè oserye. Politik sa a eksplike ki kalite enfòmasyon nou kolekte, poukisa nou kolekte yo, kijan nou itilize yo, kijan nou pwoteje yo, ak dwa ou genyen sou done pèsonèl ou. Lè w itilize platfòm nou an, ou dakò ak prensip ki dekri nan politik sa a.',
};

const LAST_UPDATED = '30 Jen 2026';

const SUMMARY = [
  {
    Icon: Lock,
    title: 'Nou pwoteje done w',
    body: 'Tout enfòmasyon sansib, tankou done medikal ak enfòmasyon peman, pwoteje ak teknoloji chifreman (encryption) pandan y ap transmèt sou chanèl kominikasyon ki sekirize.',
  },
  {
    Icon: Eye,
    title: 'Nou pa vann done w',
    body: 'Nou pa janm vann, lwe, ni pataje enfòmasyon pèsonèl ou ak okenn tyès pati pou rezon komèsyal san konsantman ou, sof si lalwa egzije sa oswa sa nesesè pou bay sèvis ou mande a.',
  },
  {
    Icon: Trash2,
    title: 'Ou ka mande efase tout',
    body: 'Ou gen dwa konsilte, telechaje, mete ajou, oswa mande efasman done pèsonèl ou nenpòt lè, dapre règleman ak kondisyon sèvis nou yo.',
  },
];

const SECTIONS = [
  { id: 'kolekte', label: '1. Sa nou kolekte' },
  { id: 'itilizasyon', label: '2. Kòman nou itilize done yo' },
  { id: 'pataj', label: '3. Avèk ki moun nou pataje' },
  { id: 'estokaj', label: '4. Kote ak konbyen tan' },
  { id: 'sekirite', label: '5. Sekirite' },
  { id: 'dwa', label: '6. Dwa ou' },
  { id: 'cookies', label: '7. Cookies ak swivi' },
  { id: 'timoun', label: '8. Timoun' },
  { id: 'chanjman', label: '9. Chanjman politik la' },
  { id: 'kontak', label: '10. Kontak konfidansyalite' },
];

export default function KonfidansyalitePage() {
  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(22,163,74,0.08), transparent 45%), radial-gradient(circle at 10% 90%, rgba(196,49,120,0.06), transparent 40%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-5">
              <Shield className="w-3.5 h-3.5" strokeWidth={2.4} />
              Konfidansyalite
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
              Done w yo se{' '}
              <span className="text-brand-600">done w yo</span>.
              <br />
              Nou pa janm bliye sa.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
              Politik sa eksplike ki enfòmasyon nou kolekte sou Hoïs Inivèsite,
              ki jan nou itilize yo, ak ki dwa ou genyen sou yo. Nou ekri li
              klè  pa gen jargon legal ki kache anyen.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-muted">
              <Calendar className="w-4 h-4" strokeWidth={2} />
              Dènye mizajou: <strong className="text-ink">{LAST_UPDATED}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── REZIME (3 CARDS) ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 -mt-6 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
            {SUMMARY.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5 md:p-6"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white mb-3">
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </span>
                <h3 className="font-display text-base md:text-lg font-bold text-ink">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KONTENU + TOC ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="grid lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
            {/* Table of contents (sticky desktop) */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Navigasyon rapid
                </div>
                <ul className="space-y-2 text-sm">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-ink-muted hover:text-brand-700 hover:translate-x-0.5 transition-all"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <article className="prose-tight max-w-none">
              <Block id="kolekte" icon={Database} title="1. Sa nou kolekte">
                <p>
                  Lè ou itilize Hoïs Inivèsite, nou kolekte 3 kategori enfòmasyon:
                </p>
                <ul>
                  <li>
                    <strong>Done idantite:</strong> non, imèl, telefòn, dat
                    nesans, vil sa w ba nou nan moman ou enskri oswa nan
                    paj paramèt ou.
                  </li>
                  <li>
                    <strong>Done sante:</strong> kondisyon medikal, mezi sik,
                    tansyon, pwa, alèji, medikaman  <em>sèlman sa ou
                    chwazi pou pataje avè n</em>.
                  </li>
                  <li>
                    <strong>Done teknik:</strong> adrès IP, kalite navigatè,
                    paj ou vizite yon ti kantite enfòmasyon ki ede nou
                    bay yon eksperyans pi bon.
                  </li>
                </ul>
                <p>
                  Ou pa ka itilize sèvis la san done idantite (paske n bezwen
                  konekte w ak kont ou); men tout lòt done yo se selon chwa w.
                </p>
              </Block>

              <Block id="itilizasyon" icon={Sparkles} title="2. Kòman nou itilize done yo">
                <p>Nou itilize done w yo pou:</p>
                <ul>
                  <li>Bay sèvis natiropatik la (konsiltasyon, tretman, gid)</li>
                  <li>
                    Pèsonalize rekòmandasyon plant ak konsèy sou kondisyon ou
                  </li>
                  <li>
                    Voye yon notifikasyon ki enpòtan: mizajou abònman, kont,
                    sipò
                  </li>
                  <li>Amelyore platfòm nan (analiz anonim)</li>
                  <li>Reponn demann sipò ou voye nou</li>
                </ul>
                <p>
                  <strong>Sa nou pa fè:</strong> Nou pa itilize done w yo pou
                  fè reklam, vann yo ak lòt antite, oswa antrene modèl
                  entèlijans atifisyèl piblik.
                </p>
              </Block>

              <Block id="pataj" icon={Globe} title="3. Avèk ki moun nou pataje">
                <p>
                  Nou pa janm vann done w. Men gen kèk patnè teknik nou itilize
                  pou platfòm la mache:
                </p>
                <ul>
                  <li>
                    <strong>Supabase</strong> sèvè baz done nou. Tout done
                    rete an Etazini sou enfrastrikti yo.
                  </li>
                  <li>
                    <strong>Vercel</strong>  sèvè ki sèvi paj yo. Pa kenbe
                    okenn done pèsonèl.
                  </li>
                  <li>
                    <strong>Stripe</strong>  pou peman (lè li aktive). Yo
                    pwosesè kat kredi a; nou pa janm wè nimewo kat ou.
                  </li>
                  <li>
                    <strong>Sètifikasyon legal:</strong> Si yon otorite legal
                    Ayisyen oswa entènasyonal mande nou  ak yon manda valid 
                    nou ka oblije bay enfòmasyon. Sa pap janm fèt anba bòl.
                  </li>
                </ul>
              </Block>

              <Block id="estokaj" icon={Database} title="4. Kote ak konbyen tan">
                <p>
                  Done yo estoke nan baz done Supabase ki nan rejyon US-West
                  (Etazini). Tout koneksyon ant navigatè w ak baz la kript ak
                  TLS.
                </p>
                <p>Kantite tan nou kenbe done yo:</p>
                <ul>
                  <li>
                    <strong>Kont aktif:</strong> tan ki abònman an aktif.
                  </li>
                  <li>
                    <strong>Apre anile:</strong> 90 jou pou pèmèt restorasyon,
                    apre sa li efase otomatikman.
                  </li>
                  <li>
                    <strong>Done finansye (resi):</strong> 7 ane (obligasyon
                    konptab).
                  </li>
                </ul>
              </Block>

              <Block id="sekirite" icon={Lock} title="5. Sekirite">
                <p>
                  Nou pran sekirite done w yo trè o serye. Mesi pratik nou aplike yo
                  enkli:
                </p>
                <ul>
                  <li>Modpas kript ak bcrypt  nou pa janm ka li yo</li>
                  <li>Done sansib (medikal) ak Row-Level Security (RLS) Postgres</li>
                  <li>Sesyon ki ekspire otomatikman</li>
                  <li>Done finansye pase atravè Stripe  pa janm sou sèvè nou</li>
                  <li>Bakap chak jou nan repèjyon jeografik diferan</li>
                </ul>
                <p className="not-italic text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 inline-flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
                  <span>
                    Si w sispèk yon vyolasyon sekirite sou kont ou, kontakte nou
                    san pèdi tan nan{' '}
                    <a
                      href="mailto:contact@hoismedikaplant.com"
                      className="font-bold underline"
                    >
                      Contact@hoismedikaplant.com
                    </a>
                    .
                  </span>
                </p>
              </Block>

              <Block id="dwa" icon={Eye} title="6. Dwa ou genyen">
                <p>Ou genyen 5 dwa fondamantal sou done w yo:</p>
                <ul>
                  <li>
                    <strong>Aksè:</strong> wè tout done nou genyen sou ou.
                  </li>
                  <li>
                    <strong>Korije:</strong> chanje sa ki pa kòrèk nan paramèt
                    kont ou.
                  </li>
                  <li>
                    <strong>Efase:</strong> mande siprime tout done w yo (yon
                    ekstre kont).
                  </li>
                  <li>
                    <strong>Ekspòte:</strong> resevwa yon kopi nan fòma PDF.
                    
                  </li>
                  <li>
                    <strong>Refize:</strong> Ou ka dezabòne nan kominikasyon pwomosyonèl nou yo nenpòt lè san sa pa afekte aksè ou ak sèvis ou yo.
                  </li>
                </ul>
                <p>
                  Pou egzèse nenpòt nan dwa sa yo, ale nan{' '}
                  <Link href="/dashboard/settings" className="text-brand-700 hover:underline font-medium">
                    paramèt kont ou
                  </Link>{' '}
                  oswa voye yon mesaj nan{' '}
                  <Link href="/kontak" className="text-brand-700 hover:underline font-medium">
                    paj kontak la
                  </Link>
                  .
                </p>
              </Block>

              <Block id="cookies" icon={Cookie} title="7. Cookies ak swivi">
                <p>
                  Nou itilize kèk cookies esansyèl pou platfòm la fonksyone —
                  pou kenbe sesyon ou konekte, sonje preferans afichaj, ak
                  pwoteje kont ou.
                </p>
                <p>
                  <strong>Sa nou pa fè:</strong> nou pa enstale cookies pou
                  reklam, swivi atravè sit, oswa pwofilaj.
                </p>
                <ul>
                  <li>
                    <strong>sb-…-auth-token</strong> — sesyon Supabase
                    (esansyèl)
                  </li>
                  <li>
                    <strong>theme</strong> — preferans afichaj (klè/fonse)
                  </li>
                </ul>
              </Block>

              <Block id="timoun" icon={Shield} title="8. Timoun">
                <p>
                  Hoïs Inivèsite a fèt pou moun (18+ ane). Si w gen mwens
                  ke 18 ane, ou bezwen pèmisyon paran oswa moun ki responsab ou pou
                  itilize sèvis la.
                </p>
                <p>
                  Si nou aprann nou kolekte done yon timoun ki gen mwens ke
                  16 ane san pèmisyon, n ap efase tout otomatikman.
                </p>
              </Block>

              <Block id="chanjman" icon={FileText} title="9. Chanjman politik la">
                <p>
                  Nou ka mete politik sa ajou tan pou tan  sitou lè nou
                  ajoute nouvo fonksyonalite oswa lè lwa yo chanje. Lè sa,
                  n ap:
                </p>
                <ul>
                  <li>Voye yon imèl ba ou ak chanjman ki enpòtan yo</li>
                  <li>Mete dat "dènye mizajou" anwo paj sa</li>
                  <li>
                   Si nou fè yon chanjman enpòtan nan Politik Konfidansyalite a, n ap fè w konnen epi, si sa nesesè, n ap mande konsantman w ankò anvan chanjman yo aplike.

                  </li>
                </ul>
                <p>
                  Si w pa dakò ak yon chanjman, ou ka anile abònman ou nenpòt
                  lè epi efase tout done w yo.
                </p>
              </Block>

              <Block id="kontak" icon={Mail} title="10. Kontak konfidansyalite">
                <p>
                  Si w gen kesyon sou politik sa yo oswa sou fason nou itilize
                  done w, kontakte nou:
                </p>
                <ul>
                  <li>
                    <strong>Imèl:</strong>{' '}
                    <a
                      href="mailto:contact@hoismedikaplant.com"
                      className="text-brand-700 hover:underline"
                    >
                      COntact@hoismedikaplant.com
                    </a>
                  </li>
                  <li>
                    <strong>Fòm kontak:</strong>{' '}
                    <Link href="/kontak" className="text-brand-700 hover:underline">
                      hoismedikaplant.com/kontak
                    </Link>{' '}
                    — chwazi sijè "Sipò manm"
                  </li>
                  <li>
                    <strong>Adrès postal:</strong>1823 S. DIXIE HIGHWAY POMPANO BEACH, FL 33060
                  </li>
                </ul>
                <p>
                  Nou angaje pou reponn nenpòt demann konfidansyalite nan
                  mwens ke 7 jou ouvrab.
                </p>
              </Block>
            </article>
          </div>
        </div>
      </section>

      {/* ── DWA NOU YO (CHECKLIST) ─────────────────────────────────── */}
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
                <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
                Nou kenbe pwomès nou
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Ou kontwole done pèsonèl ou yo.
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Konfidansyalite pa yon dokiman legal se yon kontra moralite.
                Men chak pwomès konkrè ki vin ak Hoïs Inivèsite.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                'Pa janm vann done w bay okenn lòt antite',
                'Pa itilize done sante w pou reklam oswa antrene IA',
                'Efase tout done w nan mwens ke 30 jou si ou mande sa',
                'Kript tout koneksyon ak baz la (TLS) san eksepsyon',
                'Notifye w nan mwens ke 72 èdtan si ta gen yon vyolasyon',
                'Bay yon kontak imèl direkt pou nenpòt kesyon konfidansyalite',
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

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent/10 border border-brand-100 px-6 py-14 md:px-14 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-brand-700 text-sm font-medium mb-5 shadow-sm">
              <Mail className="w-3.5 h-3.5" strokeWidth={2.4} />
              Gen kesyon?
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight max-w-3xl mx-auto">
              Si yon bagay pa klè, voye nou yon mesaj
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-ink-muted text-base md:text-lg leading-relaxed">
              N ap reponn chak demann konfidansyalite nan mwens ke 7 jou. Si
              w deja manm, itilize chat sipò a pou yon respons pi rapid.
            </p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 bg-brand-gradient hover:brightness-110 text-white px-7 py-3.5 rounded-full font-medium transition shadow-md"
              >
                Voye yon mesaj
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-ink hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition"
              >
                Jere done w yo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ─── Section block helper ─────────────────────────────────────────── */

function Block({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 py-8 first:pt-0 border-b border-slate-100 last:border-b-0"
    >
      <header className="flex items-center gap-3 mb-4">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-700 shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
          {title}
        </h2>
      </header>
      <div className="space-y-4 text-ink-muted leading-relaxed [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-relaxed [&_strong]:text-ink [&_strong]:font-semibold [&_a]:text-brand-700 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
