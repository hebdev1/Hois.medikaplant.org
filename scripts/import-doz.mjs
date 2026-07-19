/**
 * One-off / re-runnable importer: pulls the "Dòz ak Fòmil" articles from
 * medikaplant.org into public.doz_recipes so they render natively inside the
 * platform (/dashboard/reset-doz). Admin CRUD still applies afterwards —
 * this only seeds/refreshes the rows, keyed by slug (upsert).
 *
 *   node scripts/import-doz.mjs --dry     # report only, no writes
 *   node scripts/import-doz.mjs           # upsert into Supabase
 *
 * Content flows site -> DB directly; nothing is hand-copied.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import createDOMPurify from 'isomorphic-dompurify';

const DRY = process.argv.includes('--dry');

// ── env ──────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const CATEGORY_SLUG = 'doz-ak-fomil';

const ARTICLES = [
  { slug: 'beny-pou-pye-cho', tag: 'Sikilasyon', title: 'Beny pou Pye Cho', url: 'https://medikaplant.org/%f0%9f%8c%bf-beny-pou-pye-cho-sipo-pou-sikilasyon-cho-fret-kout-pye-batri/' },
  { slug: 'tretman-maladi-fredite', tag: 'Fredite', title: 'Tretman pou Maladi Fredite nan Medsin Tradisyonèl', url: 'https://medikaplant.org/tretman-pou-maladi-fredite-nan-medsin-tradisyonel/' },
  { slug: 'folat-serom-biyo-timoun', tag: 'Nitrisyon', title: 'Folat: Seròm Biyo pou timoun devlope pi byen', url: 'https://medikaplant.org/%f0%9f%8c%bf%e2%9c%a8-folat-biyo-serom-ki-ka-ede-timoun-yo-devlope-pi-byen%e2%9c%a8%f0%9f%8c%bf/' },
  { slug: 'rasin-vetive', tag: 'Dijesyon', title: 'Rasin Vetivè: yon trezò medisinal nou neglije', url: 'https://medikaplant.org/%f0%9f%8c%bf-rasin-vetive-yon-trezo-medisinal-nou-neglije/' },
  { slug: 'spem-feb-tizan-labouyi', tag: 'Fètilite', title: 'Spèm Fèb: Tizàn ak Labouyi', url: 'https://medikaplant.org/spem-feb-tizan-ak-labouyi-ki-ka-ede-rezoud-pwoblem-sa/' },
  { slug: 'doz-let-lokyostaz', tag: 'Apre akouchman', title: 'Dòz pou Fanm ki gen Pwoblèm Lèt ak Lokyostaz', url: 'https://medikaplant.org/doz-pou-fanm-ki-gen-pwoblem-let-ak-lokyostaz-pet-nan-matris/' },
  { slug: 'horsetail-ke-chwal', tag: 'Ren ak vesi', title: 'Horsetail (Ke Chwal): Pwoblèm Ren ak Vesi', url: 'https://medikaplant.org/horsetail-ke-chwal-cola-de-caballo-fikse-pwoblem-ren-vesi-lot-byenfe/' },
  { slug: 'damiana', tag: 'Afwodizyak', title: 'Damiana: Plant Afwodizyak', url: 'https://medikaplant.org/damiana-yon-gwo-plant-afwodizyak-ki-chaje-byenfe-medisinal/' },
  { slug: 'fenigrek-fenugreek', tag: 'Nitrisyon', title: 'Fenigrèk (Fenugreek): Yon Plant Nou Dwe Konnen', url: 'https://medikaplant.org/fenigrek-fenugreek-yon-plant-nou-dwe-konnen-2/' },
  { slug: '9-doz-natirel-detoks', tag: 'Detòks', title: '9 Dòz Natirèl pou Detòks ak Pwoblèm Gastro-Entestinal', url: 'https://medikaplant.org/9-doz-natirel-pou-detoks-ak-pwoblem-gastro-entestinal/' },
];

// ── extraction ───────────────────────────────────────────────────────────────
// medikaplant.org runs Elementor: the post body is the
// `elementor-widget-theme-post-content` widget (there is no .entry-content).
// Slice from that widget to the first trailing-furniture marker, then collect
// leaf content tags in order — that is tolerant of Elementor's deep div
// nesting, which regex cannot balance.
const START_MARKERS = [
  'elementor-widget-theme-post-content',
  'class="[^"]*post-content',
  'class="[^"]*entry-content',
];
const END_MARKERS = [
  'elementor-share-btn', 'jp-relatedposts', 'id="comments', 'class="comments',
  'post-navigation', 'related-posts', '<footer',
];
const CONTENT_TAG = /<(p|h2|h3|h4|ul|ol|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;

function extractBody(html) {
  let i = -1;
  for (const m of START_MARKERS) {
    i = html.search(new RegExp(m, 'i'));
    if (i !== -1) break;
  }
  if (i === -1) return null;

  let chunk = html.slice(i);
  let end = chunk.length;
  for (const m of END_MARKERS) {
    const k = chunk.search(new RegExp(m, 'i'));
    if (k > 200 && k < end) end = k;
  }
  chunk = chunk.slice(0, end);

  const parts = [...chunk.matchAll(CONTENT_TAG)]
    .map((m) => m[0])
    // drop nav/menu leftovers and empty shells
    .filter((s) => s.replace(/<[^>]*>/g, '').trim().length > 2);
  return parts.length ? parts.join('\n') : null;
}

const DOMPurify = createDOMPurify;

function clean(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'blockquote'],
    ALLOWED_ATTR: [],
  })
    .replace(/<p>(\s|&nbsp;)*<\/p>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstText(html, max = 180) {
  const t = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t;
}

// ── run ──────────────────────────────────────────────────────────────────────
const SQL_ONLY = process.argv.includes('--sql');
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const sqlRows = [];

if (!DRY && !SQL_ONLY && !SERVICE_KEY) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY manke nan .env.local.\n' +
      'Swa ajoute l, swa kouri:  node scripts/import-doz.mjs --sql\n' +
      'epi egzekite scripts/doz-import.sql nan Supabase SQL Editor.'
  );
  process.exit(1);
}

const sb = DRY || SQL_ONLY ? null : createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

let categoryId = null;
if (sb) {
  const { data } = await sb.from('doz_categories').select('id').eq('slug', CATEGORY_SLUG).maybeSingle();
  categoryId = data?.id ?? null;
}

let ok = 0, failed = 0;
for (const a of ARTICLES) {
  try {
    const res = await fetch(a.url, { headers: { 'user-agent': 'Mozilla/5.0 MedikaPlantImporter' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.text();
    const body = extractBody(raw);
    if (!body) throw new Error('no entry-content found');
    const body_html = clean(body);
    const textLen = body_html.replace(/<[^>]*>/g, '').trim().length;
    if (textLen < 200) throw new Error('body too short (' + textLen + ')');

    console.log(`${String(textLen).padStart(6)} chars  ${a.slug}`);

    const excerpt = firstText(body_html);

    if (SQL_ONLY) {
      sqlRows.push(
        `  (${q(a.slug)}, ${q(a.title)}, ${q(a.tag)}, ${q(excerpt)}, ${q(body_html)},` +
          ` (select id from public.doz_categories where slug = ${q(CATEGORY_SLUG)}), true, now())`
      );
    } else if (sb) {
      const { error } = await sb.from('doz_recipes').upsert(
        {
          slug: a.slug,
          title: a.title,
          tag: a.tag,
          excerpt,
          body_html,
          category_id: categoryId,
          published: true,
          published_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );
      if (error) throw new Error(error.message);
    }
    ok++;
  } catch (e) {
    failed++;
    console.log(`   FAIL  ${a.slug} — ${e.message}`);
  }
}
if (SQL_ONLY && sqlRows.length) {
  const sql =
    `-- Generated by scripts/import-doz.mjs — "Dòz ak Fòmil" articles from\n` +
    `-- medikaplant.org imported as native doz_recipes rows. Re-runnable\n` +
    `-- (upsert on slug), so re-importing refreshes the bodies.\n\n` +
    `insert into public.doz_recipes\n` +
    `  (slug, title, tag, excerpt, body_html, category_id, published, published_at)\n` +
    `values\n${sqlRows.join(',\n')}\n` +
    `on conflict (slug) do update set\n` +
    `  title = excluded.title, tag = excluded.tag, excerpt = excluded.excerpt,\n` +
    `  body_html = excluded.body_html, category_id = excluded.category_id,\n` +
    `  published = excluded.published, published_at = excluded.published_at,\n` +
    `  updated_at = now();\n`;
  fs.writeFileSync('scripts/doz-import.sql', sql, 'utf8');
  console.log(`\nWrote scripts/doz-import.sql (${(sql.length / 1024).toFixed(1)} KB, ${sqlRows.length} rows).`);
}
console.log(`\n${DRY ? '[dry-run] ' : ''}${ok} ok, ${failed} failed.`);
