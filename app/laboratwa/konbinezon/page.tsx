import { CircleDashed } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, readLang } from '../lab-ui';
import ComparePicker from '../konparezon/compare-picker';

export const metadata = { title: 'Konbinezon · Laboratwa' };
export const dynamic = 'force-dynamic';

const csv = (v?: string) => (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);

type P = { slug: string; name_kr: string; name_sci: string; cautions_kr: string[] | null };

export default async function KonbinezonPage({
  searchParams,
}: {
  searchParams: { p?: string; lang?: string };
}) {
  const lang = readLang(searchParams);
  const slugs = csv(searchParams.p).slice(0, 2);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data: allData } = await sb
    .from('plants').select('slug, name_kr').eq('status', 'published').order('name_kr');
  const all = (allData ?? []) as { slug: string; name_kr: string }[];

  let plants: P[] = [];
  let bothRecipe = 0;
  let totalRecipes = 0;
  if (slugs.length === 2) {
    const { data } = await sb
      .from('plants')
      .select('slug, name_kr, name_sci, cautions_kr, id')
      .in('slug', slugs)
      .eq('status', 'published');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plants = slugs.map((s) => (data ?? []).find((x: any) => x.slug === s)).filter(Boolean) as P[];

    const { count } = await sb.from('doz_recipes').select('id', { count: 'exact', head: true });
    totalRecipes = count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = (data ?? []).map((x: any) => x.id);
    if (ids.length === 2) {
      const { data: pr } = await sb.from('plant_recipes').select('plant_id, recipe_id').in('plant_id', ids);
      const byRecipe: Record<string, Set<string>> = {};
      for (const r of pr ?? []) {
        (byRecipe[r.recipe_id] ??= new Set()).add(r.plant_id);
      }
      bothRecipe = Object.values(byRecipe).filter((s) => s.size === 2).length;
    }
  }

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Konbinezon</h1>

      <div className="lab-warn">
        <b>Li sa a anvan</b>
        <p>
          Zouti sa a pa di si yon konbinezon bon oswa san danje. Li montre sèlman sa ki
          dokimante nan achiv la. Edikasyon sèlman; FDA pa evalye deklarasyon sa yo.
        </p>
      </div>

      <ComparePicker all={all} selected={slugs} max={2} />

      {plants.length < 2 ? (
        <div className="lab-empty">Chwazi 2 plant pi wo a.</div>
      ) : (
        <>
          <div className="lab-combcards">
            {plants.map((p) => (
              <div className="lab-combcard" key={p.slug}>
                <div className="lab-cname">{p.name_kr}</div>
                <div className="lab-sci" style={{ fontSize: 12.5 }}>{p.name_sci}</div>
              </div>
            ))}
          </div>

          <div className="lab-result">
            <span className="lab-label">Preparasyon dokimante ak tou de</span>
            {bothRecipe > 0 ? (
              <div>Gen <b>{bothRecipe}</b> resèt nan achiv la ki gen tou de plant sa yo.</div>
            ) : (
              <div className="none">
                <CircleDashed size={18} strokeWidth={1.8} aria-hidden />
                <span>
                  Nou pa jwenn anyen. Nan {totalRecipes} resèt ki nan achiv la, pa gen youn ki
                  gen tou de plant sa yo. Sa pa vle di li bon ni li pa bon — sa vle di nou pa
                  gen dosye sou li.
                </span>
              </div>
            )}
          </div>

          <div className="lab-result">
            <span className="lab-label">Tout prekosyon dokimante, ansanm</span>
            {plants.map((p) => (
              <div className="lab-cgroup" key={p.slug}>
                <h4>{p.name_kr}</h4>
                {(p.cautions_kr ?? []).length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(p.cautions_kr ?? []).map((c, i) => <li key={i} style={{ fontSize: 13 }}>{c}</li>)}
                  </ul>
                ) : (
                  <span className="none" style={{ color: 'var(--tes)', fontSize: 13 }}>
                    Pa gen prekosyon dokimante nan dosye a.
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="lab-note">
            Nou montre sa ki dokimante. Absans yon prekosyon pa vle di pa gen danje.
          </p>
        </>
      )}
    </div>
  );
}
