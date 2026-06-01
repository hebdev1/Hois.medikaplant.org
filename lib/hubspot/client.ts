/**
 * Thin HubSpot CRM v3 API wrapper. Used by sync helpers to push members
 * to HubSpot (as contacts) and pull contact metadata back into the
 * admin panel.
 *
 * Configuration (Vercel env):
 *   HUBSPOT_PRIVATE_APP_TOKEN  — pat-na1-... or pat-eu1-...
 *
 * If the token is missing, every call returns a typed "skipped" result
 * so the rest of the app keeps working before the integration is set up.
 *
 * Required Private App scopes:
 *   - crm.objects.contacts.read
 *   - crm.objects.contacts.write
 *   - crm.objects.deals.read   (only for the pull side)
 */

const API_BASE = 'https://api.hubapi.com';

export type HubspotResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 'skipped'; reason: 'no_token' | 'no_email' }
  | { ok: false; status: 'error'; error: string; httpStatus?: number };

export type HubspotContact = {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    lifecyclestage?: string;
    hois_plan?: string;
    hois_member_id?: string;
    hois_conditions?: string;
    hois_health_goal?: string;
    [k: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
};

export type HubspotDeal = {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    amount?: string;
    closedate?: string;
    [k: string]: string | undefined;
  };
};

function token(): string | null {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN ?? null;
}

async function hubspotFetch(
  path: string,
  init: RequestInit
): Promise<{ ok: true; res: Response } | { ok: false; reason: 'no_token' } | { ok: false; reason: 'fetch_error'; error: string }> {
  const t = token();
  if (!t) return { ok: false, reason: 'no_token' };
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      // Always force fresh data for admin reads — HubSpot data changes.
      cache: 'no-store',
    });
    return { ok: true, res };
  } catch (e) {
    return { ok: false, reason: 'fetch_error', error: (e as Error).message };
  }
}

/**
 * Look up a contact by email. Returns null when not found (404) — that's
 * not an error, just a signal to create instead.
 */
export async function getContactByEmail(
  email: string
): Promise<HubspotResult<HubspotContact | null>> {
  if (!email) {
    return { ok: false, status: 'skipped', reason: 'no_email' };
  }
  const r = await hubspotFetch('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            { propertyName: 'email', operator: 'EQ', value: email.toLowerCase() },
          ],
        },
      ],
      properties: [
        'email',
        'firstname',
        'lastname',
        'phone',
        'lifecyclestage',
        'hois_plan',
        'hois_member_id',
        'hois_conditions',
        'hois_health_goal',
      ],
      limit: 1,
    }),
  });
  if (!r.ok) {
    return r.reason === 'no_token'
      ? { ok: false, status: 'skipped', reason: 'no_token' }
      : { ok: false, status: 'error', error: r.error };
  }
  if (!r.res.ok) {
    const txt = await r.res.text().catch(() => '');
    return {
      ok: false,
      status: 'error',
      error: `HubSpot ${r.res.status}: ${txt.slice(0, 240)}`,
      httpStatus: r.res.status,
    };
  }
  const body = (await r.res.json()) as { results?: HubspotContact[] };
  return { ok: true, data: body.results?.[0] ?? null };
}

/**
 * Create or update a contact identified by email (HubSpot's natural key
 * for contacts). Push-side fields are sent verbatim — caller is
 * responsible for shaping them.
 */
export async function upsertContactByEmail(
  email: string,
  properties: Record<string, string | number | null | undefined>
): Promise<HubspotResult<{ id: string; created: boolean }>> {
  if (!email) {
    return { ok: false, status: 'skipped', reason: 'no_email' };
  }
  // Strip null/undefined so HubSpot doesn't reject the payload.
  const cleanProps: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v !== null && v !== undefined && String(v).length > 0) {
      cleanProps[k] = String(v);
    }
  }
  cleanProps.email = email.toLowerCase();

  // Step 1: is there already a contact with this email?
  const existing = await getContactByEmail(email);
  if (!existing.ok) {
    // skipped or error — propagate
    return existing as HubspotResult<{ id: string; created: boolean }>;
  }

  if (existing.data) {
    // UPDATE
    const r = await hubspotFetch(
      `/crm/v3/objects/contacts/${existing.data.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ properties: cleanProps }),
      }
    );
    if (!r.ok) {
      return { ok: false, status: 'error', error: r.reason === 'fetch_error' ? r.error : 'no_token' };
    }
    if (!r.res.ok) {
      const txt = await r.res.text().catch(() => '');
      return {
        ok: false,
        status: 'error',
        error: `HubSpot ${r.res.status}: ${txt.slice(0, 240)}`,
        httpStatus: r.res.status,
      };
    }
    return { ok: true, data: { id: existing.data.id, created: false } };
  }

  // CREATE
  const r = await hubspotFetch('/crm/v3/objects/contacts', {
    method: 'POST',
    body: JSON.stringify({ properties: cleanProps }),
  });
  if (!r.ok) {
    return { ok: false, status: 'error', error: r.reason === 'fetch_error' ? r.error : 'no_token' };
  }
  if (!r.res.ok) {
    const txt = await r.res.text().catch(() => '');
    return {
      ok: false,
      status: 'error',
      error: `HubSpot ${r.res.status}: ${txt.slice(0, 240)}`,
      httpStatus: r.res.status,
    };
  }
  const body = (await r.res.json()) as { id: string };
  return { ok: true, data: { id: body.id, created: true } };
}

/**
 * Update an existing contact by its HubSpot id. Faster than
 * upsertContactByEmail when the caller already knows the id (cached
 * on profiles.hubspot_contact_id after the first successful push).
 * Skips the search round-trip entirely.
 */
export async function upsertContactById(
  contactId: string,
  properties: Record<string, string | number | null | undefined>
): Promise<HubspotResult<{ id: string; created: boolean }>> {
  const cleanProps: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v !== null && v !== undefined && String(v).length > 0) {
      cleanProps[k] = String(v);
    }
  }
  const r = await hubspotFetch(
    `/crm/v3/objects/contacts/${contactId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ properties: cleanProps }),
    }
  );
  if (!r.ok) {
    return r.reason === 'no_token'
      ? { ok: false, status: 'skipped', reason: 'no_token' }
      : { ok: false, status: 'error', error: r.error };
  }
  if (!r.res.ok) {
    const txt = await r.res.text().catch(() => '');
    return {
      ok: false,
      status: 'error',
      error: `HubSpot ${r.res.status}: ${txt.slice(0, 240)}`,
      httpStatus: r.res.status,
    };
  }
  return { ok: true, data: { id: contactId, created: false } };
}

/**
 * Pull: fetch up to 5 most-recent deals associated with a contact.
 * Used by the admin panel to show a member's HubSpot deal pipeline.
 */
export async function getDealsForContact(
  contactId: string
): Promise<HubspotResult<HubspotDeal[]>> {
  if (!contactId) {
    return { ok: true, data: [] };
  }
  // Look up associated deal ids
  const assoc = await hubspotFetch(
    `/crm/v4/objects/contacts/${contactId}/associations/deals?limit=5`,
    { method: 'GET' }
  );
  if (!assoc.ok) {
    return assoc.reason === 'no_token'
      ? { ok: false, status: 'skipped', reason: 'no_token' }
      : { ok: false, status: 'error', error: assoc.error };
  }
  if (!assoc.res.ok) {
    if (assoc.res.status === 404) return { ok: true, data: [] };
    return {
      ok: false,
      status: 'error',
      error: `HubSpot ${assoc.res.status}`,
      httpStatus: assoc.res.status,
    };
  }
  const assocBody = (await assoc.res.json()) as {
    results?: { toObjectId: string }[];
  };
  const ids = (assocBody.results ?? []).map((r) => r.toObjectId);
  if (ids.length === 0) return { ok: true, data: [] };

  // Batch-read those deals
  const batch = await hubspotFetch(
    '/crm/v3/objects/deals/batch/read',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: ['dealname', 'dealstage', 'amount', 'closedate'],
        inputs: ids.map((id) => ({ id })),
      }),
    }
  );
  if (!batch.ok) {
    return batch.reason === 'no_token'
      ? { ok: false, status: 'skipped', reason: 'no_token' }
      : { ok: false, status: 'error', error: batch.error };
  }
  if (!batch.res.ok) {
    return { ok: false, status: 'error', error: `HubSpot ${batch.res.status}` };
  }
  const batchBody = (await batch.res.json()) as { results?: HubspotDeal[] };
  return { ok: true, data: batchBody.results ?? [] };
}
