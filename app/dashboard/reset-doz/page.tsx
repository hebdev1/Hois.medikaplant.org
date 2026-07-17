import { FlaskConical, ExternalLink, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';

export const metadata = { title: 'Resèt ak Dòz · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

// Sourced from medikaplant.org/category/doz-ak-fomil/. Each links to the
// full recipe on the blog; the tag is the main topic.
const ARTICLES: Array<{ title: string; url: string; tag: string }> = [
  { title: 'Beny pou Pye Cho', url: 'https://medikaplant.org/%f0%9f%8c%bf-beny-pou-pye-cho-sipo-pou-sikilasyon-cho-fret-kout-pye-batri/', tag: 'Sikilasyon · cho-frèt · kout pye' },
  { title: 'Tretman pou Maladi Fredite nan Medsin Tradisyonèl', url: 'https://medikaplant.org/tretman-pou-maladi-fredite-nan-medsin-tradisyonel/', tag: 'Fredite' },
  { title: 'Folat: Seròm Biyo pou timoun devlope pi byen', url: 'https://medikaplant.org/%f0%9f%8c%bf%e2%9c%a8-folat-biyo-serom-ki-ka-ede-timoun-yo-devlope-pi-byen%e2%9c%a8%f0%9f%8c%bf/', tag: 'Nitrisyon · timoun' },
  { title: 'Rasin Vetivè: yon trezò medisinal nou neglije', url: 'https://medikaplant.org/%f0%9f%8c%bf-rasin-vetive-yon-trezo-medisinal-nou-neglije/', tag: 'Dijesyon' },
  { title: 'Spèm Fèb: Tizàn ak Labouyi', url: 'https://medikaplant.org/spem-feb-tizan-ak-labouyi-ki-ka-ede-rezoud-pwoblem-sa/', tag: 'Fètilite' },
  { title: 'Dòz pou Fanm ki gen Pwoblèm Lèt ak Lokyostaz', url: 'https://medikaplant.org/doz-pou-fanm-ki-gen-pwoblem-let-ak-lokyostaz-pet-nan-matris/', tag: 'Apre akouchman · lèt' },
  { title: 'Horsetail (Ke Chwal): Pwoblèm Ren ak Vesi', url: 'https://medikaplant.org/horsetail-ke-chwal-cola-de-caballo-fikse-pwoblem-ren-vesi-lot-byenfe/', tag: 'Ren · vesi' },
  { title: 'Damiana: Plant Afwodizyak', url: 'https://medikaplant.org/damiana-yon-gwo-plant-afwodizyak-ki-chaje-byenfe-medisinal/', tag: 'Afwodizyak' },
  { title: 'Fenigrèk (Fenugreek): Yon Plant Nou Dwe Konnen', url: 'https://medikaplant.org/fenigrek-fenugreek-yon-plant-nou-dwe-konnen-2/', tag: 'Nitrisyon' },
  { title: '9 Dòz Natirèl pou Detòks ak Pwoblèm Gastro-Entestinal', url: 'https://medikaplant.org/9-doz-natirel-pou-detoks-ak-pwoblem-gastro-entestinal/', tag: 'Detòks · dijesyon' },
];

export default async function ResetDozPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('plan, full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Resèt`}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto grid gap-5">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <FlaskConical className="w-3.5 h-3.5" strokeWidth={2.2} />
            Resèt ak Dòz
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Dòz ak fòmil natirèl
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Resèt fèy tradisyonèl yo — klike sou youn pou li tout dòz la sou
            medikaplant.org.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {ARTICLES.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 bg-white border border-cream-200 rounded-2xl p-4 shadow-card hover:shadow-cardHover hover:border-forest-300 transition"
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 shrink-0">
                <Leaf className="w-5 h-5" strokeWidth={1.9} />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-ink leading-snug group-hover:text-forest-700 transition">
                  {a.title}
                </h2>
                <span className="mt-1 inline-block text-[11px] text-earth-500">
                  {a.tag}
                </span>
              </div>
              <ExternalLink
                className="w-4 h-4 text-earth-400 group-hover:text-forest-600 shrink-0 mt-1"
                strokeWidth={2}
              />
            </a>
          ))}
        </div>

        <p className="text-[10px] leading-snug text-earth-500">
          Sijesyon edikatif sèlman — pa yon dyagnostik. Konsilte yon
          pwofesyonèl sante anvan ou itilize remèd fèy.
        </p>
      </div>
    </>
  );
}
