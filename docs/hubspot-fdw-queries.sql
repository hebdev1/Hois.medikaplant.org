-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ HubSpot FDW companion queries                                          ║
-- ║                                                                        ║
-- ║ Run these in Supabase SQL Editor AFTER you finish creating the         ║
-- ║ HubSpot wrapper + foreign tables via Studio → Integrations → HubSpot.  ║
-- ║                                                                        ║
-- ║ Pre-requisites (set up by the Studio wizard):                          ║
-- ║   1. The `wrappers` extension is installed (already done).             ║
-- ║   2. A foreign server (e.g. "hubps_server_server") created from        ║
-- ║      Studio with a valid PRIVATE APP TOKEN.                            ║
-- ║   3. Foreign tables in the `hubspot` schema:                           ║
-- ║         hubspot.contacts (object 'contacts')                           ║
-- ║         hubspot.deals    (object 'deals')                              ║
-- ║                                                                        ║
-- ║ These queries are READ-ONLY against HubSpot. Pushes (create/update     ║
-- ║ contacts) go through the Next.js side via lib/hubspot/sync.ts.         ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Count VIP HubSpot contacts (HubSpot side only)
-- ───────────────────────────────────────────────────────────────────────────
SELECT count(*) AS vip_contacts
FROM hubspot.contacts
WHERE properties->>'hois_plan' = 'vip';


-- ───────────────────────────────────────────────────────────────────────────
-- 2. Cross-system join: Supabase profile × HubSpot contact, by email
--    Returns each member's plan in Supabase + their lifecycle stage in
--    HubSpot, so you can spot mismatches (e.g. paid in Supabase but still
--    "lead" in HubSpot).
-- ───────────────────────────────────────────────────────────────────────────
SELECT
  p.id                           AS supabase_id,
  p.email,
  p.full_name,
  p.plan                         AS supabase_plan,
  h.properties->>'hois_plan'     AS hubspot_plan,
  h.properties->>'lifecyclestage' AS hubspot_stage,
  h.id                           AS hubspot_contact_id,
  h.created_at                   AS hubspot_created_at
FROM public.profiles p
LEFT JOIN hubspot.contacts h
       ON lower(h.properties->>'email') = lower(p.email)
WHERE p.role = 'user'
ORDER BY p.created_at DESC
LIMIT 100;


-- ───────────────────────────────────────────────────────────────────────────
-- 3. Plan mismatches — members whose Supabase plan != HubSpot's hois_plan
--    Useful for catching stale CRM data after manual edits in HubSpot.
-- ───────────────────────────────────────────────────────────────────────────
SELECT
  p.email,
  p.plan       AS supabase_plan,
  h.properties->>'hois_plan' AS hubspot_plan
FROM public.profiles p
JOIN hubspot.contacts h
     ON lower(h.properties->>'email') = lower(p.email)
WHERE p.role = 'user'
  AND p.plan IS DISTINCT FROM (h.properties->>'hois_plan');


-- ───────────────────────────────────────────────────────────────────────────
-- 4. Members in Supabase NOT in HubSpot
--    Should be empty if push sync runs on every plan change.
-- ───────────────────────────────────────────────────────────────────────────
SELECT p.id, p.email, p.plan, p.created_at
FROM public.profiles p
LEFT JOIN hubspot.contacts h
       ON lower(h.properties->>'email') = lower(p.email)
WHERE p.role = 'user'
  AND h.id IS NULL
ORDER BY p.created_at DESC;


-- ───────────────────────────────────────────────────────────────────────────
-- 5. HubSpot contacts NOT in Supabase
--    Typically marketing leads who haven't signed up yet.
-- ───────────────────────────────────────────────────────────────────────────
SELECT h.id AS hubspot_contact_id,
       h.properties->>'email'  AS email,
       h.properties->>'lifecyclestage' AS stage,
       h.created_at
FROM hubspot.contacts h
LEFT JOIN public.profiles p
       ON lower(p.email) = lower(h.properties->>'email')
WHERE p.id IS NULL
ORDER BY h.created_at DESC
LIMIT 100;


-- ───────────────────────────────────────────────────────────────────────────
-- 6. Active deals per member (HubSpot side)
--    Note: deals are linked to contacts via associations; this naive query
--    assumes the HubSpot wrapper exposes deal contacts. If your foreign
--    table schema doesn't include the association column, use the
--    Next.js helper getDealsForContact() instead.
-- ───────────────────────────────────────────────────────────────────────────
-- SELECT p.email, count(d.id) AS open_deals, sum(d.properties->>'amount')::numeric AS pipeline
-- FROM public.profiles p
-- JOIN hubspot.contacts h ON lower(h.properties->>'email') = lower(p.email)
-- JOIN hubspot.deals d    ON ...  -- depends on association exposure
-- WHERE d.properties->>'dealstage' NOT IN ('closedwon','closedlost')
-- GROUP BY p.email;


-- ───────────────────────────────────────────────────────────────────────────
-- 7. Create a stable VIEW for the admin dashboard
--    Once you're happy with query #2, wrap it as a view so the Next.js
--    /admin/hubspot page can SELECT directly without re-typing the JOIN.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_hubspot_member_overview AS
SELECT
  p.id                            AS supabase_id,
  p.email,
  p.full_name,
  p.plan                          AS supabase_plan,
  p.hubspot_contact_id            AS cached_hubspot_id,
  h.id                            AS live_hubspot_id,
  h.properties->>'hois_plan'      AS hubspot_plan,
  h.properties->>'lifecyclestage' AS hubspot_stage,
  h.properties->>'createdate'     AS hubspot_created_at,
  -- Sync health: 'in_sync' | 'plan_mismatch' | 'in_supabase_only' | 'in_hubspot_only'
  CASE
    WHEN h.id IS NULL THEN 'in_supabase_only'
    WHEN p.id IS NULL THEN 'in_hubspot_only'
    WHEN p.plan IS DISTINCT FROM (h.properties->>'hois_plan') THEN 'plan_mismatch'
    ELSE 'in_sync'
  END                             AS sync_state
FROM public.profiles p
FULL OUTER JOIN hubspot.contacts h
            ON lower(h.properties->>'email') = lower(p.email);

GRANT SELECT ON public.v_hubspot_member_overview TO authenticated;

-- Then from anywhere you can do:
-- SELECT sync_state, count(*) FROM v_hubspot_member_overview GROUP BY sync_state;
