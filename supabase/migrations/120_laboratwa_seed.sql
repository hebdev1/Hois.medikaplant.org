-- Laboratwa Faz 1 seed: 25 well-known Haitian plants with botanical facts only
-- (names KR/FR/EN + scientific + family, parts used, preparation methods,
-- season, region). The health-sensitive fields — support_kr (traditional use)
-- and cautions_kr — are intentionally left empty for a curator to fill from a
-- documented source (TRAMIL); the UI shows that absence honestly. Genuinely
-- toxic plants (e.g. maskreti/castor) are deliberately excluded from the seed
-- so nothing dangerous shows with empty cautions.

insert into public.plants
  (slug, name_kr, name_fr, name_en, name_sci, family, parts_used, preparations, season_months, regions, summary_kr, status)
values
('asosi','Asosi','Pomme coolie','Bitter melon','Momordica charantia','Cucurbitaceae','{fey,fwi}','{te,bouyi}','{5,6,7,8,9,10}','{OU,SU,AR}','Lyann ki grenpe ak yon fwi anme ki grandi nan tout peyi a.','published'),
('sitwonel','Sitwonel','Citronnelle','Lemongrass','Cymbopogon citratus','Poaceae','{fey}','{te,bouyi}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,SU,SE,AR}','Zeb santi bon ki fe touf, moun konn plante l bo kay.','published'),
('jenjanm','Jenjanm','Gingembre','Ginger','Zingiber officinale','Zingiberaceae','{rasin}','{te,bouyi,siwo}','{9,10,11,12}','{GA,SU,NI}','Rasin pikan ki grandi anba te.','published'),
('papay','Papay','Papaye','Papaya','Carica papaya','Caricaceae','{fey,fwi,grenn}','{te,tranpe}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,AR,NO,SU}','Pyebwa fwi ki bay yon fwi jon dous.','published'),
('korosol','Korosol','Corossol','Soursop','Annona muricata','Annonaceae','{fey,fwi}','{te,bouyi}','{6,7,8,9,10}','{SU,GA,NI}','Pyebwa fwi ve ak pikan mou sou po a.','published'),
('lalwa','Lalwa','Aloes','Aloe vera','Aloe vera','Asphodelaceae','{fey}','{konpes,luil}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,NW,SU}','Plant ak fey epe ki gen jel anndan.','published'),
('sitwon','Sitwon','Citron vert','Lime','Citrus aurantifolia','Rutaceae','{fwi,fey}','{te,siwo}','{10,11,12,1,2}','{SU,GA,SE}','Pyebwa sitrik ki bay ti sitwon ve.','published'),
('bazilik','Bazilik','Basilic','Basil','Ocimum basilicum','Lamiaceae','{fey,fle}','{te}','{3,4,5,6,7,8,9,10}','{OU,AR}','Zeb santi bon ki fe ti touf nan jaden.','published'),
('ave','Ave','Ave','Guinea henweed','Petiveria alliacea','Phytolaccaceae','{fey,rasin}','{te,benyen}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,SU,CE}','Plant ak yon sant fo tankou lay.','published'),
('gwayav','Gwayav','Goyave','Guava','Psidium guajava','Myrtaceae','{fey,fwi}','{te,bouyi}','{6,7,8,9}','{OU,SU,AR}','Pyebwa fwi ak fey ki santi bon.','published'),
('mango','Mango','Mangue','Mango','Mangifera indica','Anacardiaceae','{fey,fwi,ekos}','{te}','{4,5,6,7}','{AR,SU,NO}','Gwo pyebwa fwi ki bay mango nan sezon ete.','published'),
('zaboka','Zaboka','Avocat','Avocado','Persea americana','Lauraceae','{fey,grenn,fwi}','{te}','{7,8,9,10,11}','{GA,SU,NI,OU}','Pyebwa ki bay zaboka.','published'),
('kanel','Kanel','Cannelle','Cinnamon','Cinnamomum zeylanicum','Lauraceae','{ekos,fey}','{te,bouyi}','{1,2,3,4,5,6,7,8,9,10,11,12}','{GA,SU}','Pyebwa ki bay yon ekos santi bon.','published'),
('safran','Safran','Curcuma','Turmeric','Curcuma longa','Zingiberaceae','{rasin}','{te,bouyi}','{10,11,12,1}','{GA,SU}','Rasin jon fonse ki grandi anba te.','published'),
('tamaren','Tamaren','Tamarin','Tamarind','Tamarindus indica','Caesalpiniaceae','{fwi,fey}','{tranpe,siwo}','{2,3,4}','{NW,AR,OU}','Gwo pyebwa ak gous asid.','published'),
('fey-lougawou','Fey lougawou','Feuille sorcier','Life plant','Bryophyllum pinnatum','Crassulaceae','{fey}','{konpes,te}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,SU,SE}','Plant ak fey epe ki fe ti plant sou rebo yo.','published'),
('womaren','Womaren','Romarin','Rosemary','Rosmarinus officinalis','Lamiaceae','{fey}','{te}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,CE}','Ti touf ak fey tankou zegwi ki santi bon.','published'),
('ten','Ten','Thym','Thyme','Thymus vulgaris','Lamiaceae','{fey}','{te}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,AR}','Ti zeb santi bon pou kwizin.','published'),
('mamanwann','Mamanwann','Mamanwann','John Charles','Hyptis verticillata','Lamiaceae','{fey}','{te,benyen}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU,SU,CE}','Zeb ki fe gwo touf ak ti fle blan.','published'),
('simenkontra','Simenkontra','Semen-contra','Wormseed','Chenopodium ambrosioides','Chenopodiaceae','{fey,grenn}','{te}','{6,7,8,9}','{OU,AR}','Zeb ak yon sant fo anpil.','published'),
('grenad','Grenad','Grenade','Pomegranate','Punica granatum','Punicaceae','{fwi,ekos,fey}','{te,bouyi}','{9,10,11}','{NW,AR}','Ti pyebwa ak fwi wouj ki gen anpil grenn.','published'),
('nim','Nim','Neem','Neem','Azadirachta indica','Meliaceae','{fey,ekos}','{te,benyen}','{1,2,3,4,5,6,7,8,9,10,11,12}','{NW,AR,OU}','Pyebwa ak fey anme.','published'),
('pesi','Pesi','Persil','Parsley','Petroselinum sativum','Apiaceae','{fey}','{te}','{1,2,3,4,5,6,7,8,9,10,11,12}','{OU}','Ti zeb ve pou kwizin.','published'),
('gonbo','Gonbo','Gombo','Okra','Hibiscus esculentus','Malvaceae','{fwi,fey}','{bouyi}','{5,6,7,8,9}','{AR,OU,SU}','Plant potaje ak fwi ve long.','published'),
('mandarin','Mandarin','Mandarine','Mandarin','Citrus reticulata','Rutaceae','{fwi,fey}','{te}','{11,12,1}','{SU,GA}','Pyebwa sitrik ak ti fwi dous.','published')
on conflict (slug) do nothing;
