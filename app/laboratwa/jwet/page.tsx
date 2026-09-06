import { createClient } from '@/lib/supabase/server';
import { LabHeader, readLang } from '../lab-ui';
import Quiz, { type Question } from './quiz';

export const metadata = { title: 'Konnen fèy ou · Laboratwa' };
export const dynamic = 'force-dynamic';

type P = { name_kr: string; name_sci: string; family: string | null };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const distinct = (a: string[]) => Array.from(new Set(a.filter(Boolean)));

function build(plants: P[], n = 8): Question[] {
  const pool = shuffle(plants).slice(0, Math.min(n, plants.length));
  const allSci = distinct(plants.map((p) => p.name_sci));
  const allKr = distinct(plants.map((p) => p.name_kr));
  const allFam = distinct(plants.map((p) => p.family ?? ''));
  const pick3 = (from: string[], not: string) =>
    shuffle(from.filter((x) => x !== not)).slice(0, 3);

  const qs: Question[] = [];
  pool.forEach((p, i) => {
    const type = i % 3;
    let q: Question;
    if (type === 0) {
      const opts = shuffle([p.name_sci, ...pick3(allSci, p.name_sci)]);
      q = { q: `Ki non syantifik pou « ${p.name_kr} » ?`, options: opts,
        answer: opts.indexOf(p.name_sci), explain: `« ${p.name_kr} » se ${p.name_sci}.` };
    } else if (type === 1 && p.family) {
      const opts = shuffle([p.family, ...pick3(allFam, p.family)]);
      q = { q: `Ki fanmi botanik « ${p.name_kr} » ?`, options: opts,
        answer: opts.indexOf(p.family), explain: `« ${p.name_kr} » nan fanmi ${p.family}.` };
    } else {
      const opts = shuffle([p.name_kr, ...pick3(allKr, p.name_kr)]);
      q = { q: `Ki plant ki rele « ${p.name_sci} » ?`, options: opts,
        answer: opts.indexOf(p.name_kr), explain: `${p.name_sci} se non syantifik « ${p.name_kr} ».` };
    }
    qs.push(q);
  });
  return qs;
}

export default async function JwetPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = readLang(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants').select('name_kr, name_sci, family').eq('status', 'published');
  const questions = build((data ?? []) as P[]);

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Konnen fèy ou</h1>
      <p className="lab-lead">
        Yon ti jwèt rekonesans: non, fanmi ak sezon. Pa gen okenn kesyon sou kantite ni
        sou doz.
      </p>
      {questions.length >= 3 ? (
        <Quiz questions={questions} />
      ) : (
        <div className="lab-empty">Nou bezwen plis plant nan achiv la pou jwèt la.</div>
      )}
    </div>
  );
}
