-- Glossary of Haitian plants (Glosè Plant Ayisyen). Backs the public /glose
-- reader and the admin CRUD at /admin/glose. Public reads active rows; admins
-- manage everything (the admin actions also use the service role after their
-- own capability gate, so this policy is defense-in-depth).

create table if not exists public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  code text unique,                 -- catalog id, e.g. GLOS-0001
  letter text not null default 'A', -- A–Z section
  name text not null,               -- Kreyòl name
  variants text[] not null default '{}',
  family text,                      -- botanical family
  scientific_name text,             -- e.g. Mammea americana L.
  tramil text not null default 'pa-jwenn'
    check (tramil in ('konfime','pa-jwenn')),
  status text not null default 'pwovizwa'
    check (status in ('verifye','pwovizwa','pwoblèm')),
  note text,                        -- editorial note
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists glossary_terms_letter_idx
  on public.glossary_terms (letter, display_order);

alter table public.glossary_terms enable row level security;

-- Public read only. Anon must NOT evaluate a policy that queries profiles
-- (anon has no access to profiles → "permission denied" that kills the read).
-- All admin writes go through the service role in the admin actions, which
-- bypasses RLS, so no admin policy is needed here.
drop policy if exists "glossary public read" on public.glossary_terms;
create policy "glossary public read" on public.glossary_terms
  for select using (active = true);

-- The anon role needs an explicit table grant on top of the RLS policy so
-- logged-out visitors can read the public glossary.
grant select on public.glossary_terms to anon;

-- Seed letter A (21 entries) from the reviewed source list. jsonb keeps the
-- long editorial notes and « » quotes intact without manual escaping.
insert into public.glossary_terms
  (code, letter, name, variants, family, scientific_name, tramil, status, note, display_order)
select
  x->>'id', 'A', x->>'k',
  coalesce((select array_agg(v) from jsonb_array_elements_text(x->'v') v), '{}'),
  nullif(x->>'f',''), nullif(x->>'n',''), x->>'tramil', x->>'estati', nullif(x->>'note',''),
  (row_number() over ())::int
from jsonb_array_elements($json$
[{"id":"GLOS-0001","k":"Abriko","v":["abriko peyi","zabriko"],"f":"Clusiaceae","n":"Mammea americana L.","tramil":"pa-jwenn","estati":"pwovizwa","note":""},{"id":"GLOS-0002","k":"Absent","v":["labsent","absent mawon"],"f":"Asteraceae","n":"Artemisia sp. ?","tramil":"pa-jwenn","estati":"pwoblèm","note":"Sous la pa bay yon espès. Non fransè a («absinthe») endike Artemisia absinthium L., pou konfime. Sous la mete tou «bale amè» ak «zèbapyan» kòm varyant; men zèb pyan parèt yon lòt kote pou Heliotropium indicum. Varyant sa yo retire an atandan yon desizyon."},{"id":"GLOS-0003","k":"Absent anglè","v":[],"f":"Asteraceae","n":"Ambrosia peruviana Willd.","tramil":"konfime","estati":"verifye","note":"TRAMIL konfime non an ak de sinonim: Ambrosia paniculata var. peruviana (Willd.) O.E. Schulz ; Ambrosia paniculata var. cumanensis (Kunth) O.E. Schulz. TRAMIL avize pou lave plant la anvan itilizasyon, akòz polen alèjik sou branch ak fèy yo."},{"id":"GLOS-0004","k":"Adiyant","v":[],"f":"","n":"","tramil":"pa-jwenn","estati":"pwoblèm","note":"Okenn done nan sous la. Ipotèz: Adiantum spp. (Pteridaceae), «capillaire» an fransè. Bezwen konfimasyon sou teren."},{"id":"GLOS-0005","k":"Adotada","v":[],"f":"Acanthaceae","n":"Adhatoda vasica Nees","tramil":"pa-jwenn","estati":"pwoblèm","note":"Non ki aksepte kounye a se Justicia adhatoda L.; Adhatoda vasica se yon sinonim. Pou desizyon: èske katalog la kenbe non sous la oswa li adopte non aktyèl la?"},{"id":"GLOS-0006","k":"Afyo","v":[],"f":"Cyperaceae","n":"Cyperus rotundus L.","tramil":"pa-jwenn","estati":"pwovizwa","note":""},{"id":"GLOS-0007","k":"Agoman","v":["angoman"],"f":"Solanaceae","n":"Solanum nigrum L.","tramil":"pa-jwenn","estati":"pwoblèm","note":"Nan Karayib la, plant sa a se souvan Solanum americanum Mill. olye Solanum nigrum L., ki se yon espès ewopeyen. Pou verifye sou teren."},{"id":"GLOS-0008","k":"Agoumpa","v":["zèb anmè"],"f":"","n":"","tramil":"pa-jwenn","estati":"pwoblèm","note":"Okenn fanmi ni non syantifik nan sous la."},{"id":"GLOS-0009","k":"Akajou","v":[],"f":"Meliaceae","n":"Swietenia mahagoni (L.) Jacq.","tramil":"pa-jwenn","estati":"pwoblèm","note":"Sous la ekri «Swietenia mahogony L.», de fot: ortograf espès la (mahagoni) ak otorite a ((L.) Jacq.). Korije isit. Antre sa a fè doub ak «Kajou» (GLOS-0162) ki pote menm espès la."},{"id":"GLOS-0010","k":"Aki","v":[],"f":"Sapindaceae","n":"Blighia sapida K.D. Koenig","tramil":"pa-jwenn","estati":"pwovizwa","note":"Sous la ekri otorite a «König»; fòm konplè a se K.D. Koenig."},{"id":"GLOS-0011","k":"Akoma","v":[],"f":"","n":"","tramil":"pa-jwenn","estati":"pwoblèm","note":"Okenn done nan sous la. Ipotèz: Sideroxylon foetidissimum Jacq. (Sapotaceae), «acomat» an fransè. Bezwen konfimasyon."},{"id":"GLOS-0012","k":"Alawout","v":["arawout"],"f":"Marantaceae","n":"Maranta arundinacea L.","tramil":"pa-jwenn","estati":"pwovizwa","note":"Fè doub ak «Sagou, alawout» (GLOS-0323), menm espès. Pou desizyon: konbine yo an yon sèl antre ak yon referans kwaze."},{"id":"GLOS-0013","k":"Aloès","v":[],"f":"Agavaceae","n":"Agave antillarum Descourt.","tramil":"pa-jwenn","estati":"pwoblèm","note":"KONTRADIKSYON GRAV. Non «aloès» nòmalman voye sou Aloe vera (L.) Burm.f., ki nan katalog la deja anba «Lalwa» (GLOS-0221, Asphodelaceae). Agave antillarum se yon lòt fanmi nèt. Swa non kreyòl la mal plase, swa se de plant diferan ki pataje non an. Bezwen desizyon."},{"id":"GLOS-0014","k":"Amwaz","v":[],"f":"Asteraceae","n":"Artemisia vulgaris L.","tramil":"pa-jwenn","estati":"pwovizwa","note":"Gade tou GLOS-0002 (Absent), de antre Artemisia ki bezwen distenge klèman."},{"id":"GLOS-0015","k":"Anana","v":["zalanna","zannanna"],"f":"Bromeliaceae","n":"Ananas comosus (L.) Merr.","tramil":"pa-jwenn","estati":"pwoblèm","note":"Sous la ekri «Ananas comosus L.»; otorite ki kòrèk la se (L.) Merr."},{"id":"GLOS-0016","k":"Anana pengwen","v":["zannanna pengwen","bayonèt pengwen"],"f":"Bromeliaceae","n":"Bromelia pinguin L.","tramil":"pa-jwenn","estati":"pwovizwa","note":"Sous la mete antre sa a anba menm tèt «Anana (zalanna)» ak GLOS-0015. Separe isit paske se de espès diferan."},{"id":"GLOS-0017","k":"Anis","v":["lanni"],"f":"Apiaceae","n":"Foeniculum vulgare Mill.","tramil":"pa-jwenn","estati":"pwoblèm","note":"KONFLI. Sous la bay «lanni» kòm varyant anis (Foeniculum vulgare), men gen yon antre separe «Lanni» (GLOS-0224) ki pote Anethum graveolens L. Se de plant diferan. Bezwen desizyon sou ki non ki ale ak ki espès."},{"id":"GLOS-0018","k":"Aralie","v":[],"f":"Araliaceae","n":"Dendropanax arboreus (L.) Decne. & Planch.","tramil":"pa-jwenn","estati":"pwoblèm","note":"Sous la ekri «Dendropanax arboreum» san otorite. Fòm ki kòrèk la se arboreus."},{"id":"GLOS-0019","k":"Asosi","v":["asowosi"],"f":"Cucurbitaceae","n":"Momordica charantia L.","tramil":"konfime","estati":"verifye","note":"TRAMIL konfime non an, san sinonim. TRAMIL dokimante itilizasyon pou pwoblèm po ak pou rim."},{"id":"GLOS-0020","k":"Atiyayo","v":[],"f":"Lamiaceae","n":"Ocimum micranthum Willd.","tramil":"konfime","estati":"verifye","note":"TRAMIL konfime non an ak sinonim Ocimum campechianum Mill."},{"id":"GLOS-0021","k":"Ave","v":["fèy ave"],"f":"Phytolaccaceae","n":"Petiveria alliacea L.","tramil":"konfime","estati":"pwoblèm","note":"TRAMIL konfime espès la ak sinonim Petiveria foetida Salisb. MEN klasifikasyon modèn mete l nan Petiveriaceae, pa Phytolaccaceae. Bezwen desizyon sou ki sistèm fanmi katalog la swiv."}]
$json$::jsonb) x
where not exists (select 1 from public.glossary_terms g where g.code = x->>'id');
