import { ExternalLink, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  getContactByEmail,
  getDealsForContact,
  type HubspotContact,
  type HubspotDeal,
} from '@/lib/hubspot/client';
import HubspotSyncButton from './hubspot-sync-button';

/**
 * Server-rendered HubSpot panel for the admin user detail page.
 * Pull side: looks up the contact by email + recent deals.
 * Push side: a small client button to force-sync on demand.
 * Also shows the last `hubspot_sync_log` row for paper-trail visibility.
 *
 * Renders nothing intrusive if the token isn't set — just a hint card.
 */
export default async function HubspotCard({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const supabase = createClient();

  // Last sync (admin RLS lets this read)
  const { data: lastLogRaw } = await supabase
    .from('hubspot_sync_log')
    .select('direction, status, detail, hubspot_contact_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastLog = lastLogRaw as {
    direction: 'push' | 'pull';
    status: 'ok' | 'error' | 'skipped';
    detail: string | null;
    hubspot_contact_id: string | null;
    created_at: string;
  } | null;

  // Live pull
  const contactRes = await getContactByEmail(email);
  let contact: HubspotContact | null = null;
  let deals: HubspotDeal[] = [];
  let pullError: string | null = null;
  let tokenMissing = false;

  if (contactRes.ok) {
    contact = contactRes.data;
    if (contact) {
      const dealsRes = await getDealsForContact(contact.id);
      if (dealsRes.ok) deals = dealsRes.data;
    }
  } else if (contactRes.status === 'skipped' && contactRes.reason === 'no_token') {
    tokenMissing = true;
  } else if (contactRes.status === 'error') {
    pullError = contactRes.error;
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#ff7a59] font-bold mb-1">
            HubSpot CRM
          </div>
          <h2 className="font-display text-lg font-bold text-ink">
            Sinkronizasyon
          </h2>
        </div>
        <HubspotSyncButton userId={userId} />
      </header>

      {tokenMissing && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <div>
            <strong>HUBSPOT_PRIVATE_APP_TOKEN poko konfigire.</strong> Mete l
            nan env Vercel ou (Settings → Environment Variables) epi
            re-deplwaye. Apre sa, sinkronizasyon an ap kòmanse otomatikman
            sou chak chanjman plan + bouton sa.
          </div>
        </div>
      )}

      {pullError && !tokenMissing && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{pullError}</span>
        </div>
      )}

      {/* Contact (pull) */}
      {contact ? (
        <div className="rounded-xl bg-cream-50/60 border border-cream-200 p-4 mb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-earth-600 font-bold mb-0.5">
                Kontak HubSpot
              </div>
              <div className="text-sm font-semibold text-ink">
                {[
                  contact.properties.firstname,
                  contact.properties.lastname,
                ]
                  .filter(Boolean)
                  .join(' ') || contact.properties.email || '—'}
              </div>
              <div className="text-[11px] text-earth-500 font-mono mt-0.5">
                ID {contact.id}
              </div>
            </div>
            <a
              href={`https://app.hubspot.com/contacts/_/contact/${contact.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ff7a59] hover:underline"
            >
              Ouvè nan HubSpot
              <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
            </a>
          </div>

          <dl className="grid sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
            {contact.properties.lifecyclestage && (
              <KV
                label="Etap lavi"
                value={contact.properties.lifecyclestage}
              />
            )}
            {contact.properties.hois_plan && (
              <KV label="Plan Hoïs" value={contact.properties.hois_plan} />
            )}
            {contact.properties.phone && (
              <KV label="Telefòn" value={contact.properties.phone} />
            )}
            {contact.properties.hois_health_goal && (
              <KV
                label="Objektif sante"
                value={contact.properties.hois_health_goal}
              />
            )}
            {contact.properties.hois_conditions && (
              <KV
                label="Kondisyon"
                value={contact.properties.hois_conditions}
              />
            )}
          </dl>

          {deals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cream-200/60">
              <div className="text-[10px] uppercase tracking-wide text-earth-600 font-bold mb-2">
                Deals ({deals.length})
              </div>
              <ul className="space-y-1.5">
                {deals.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-ink truncate">
                      {d.properties.dealname ?? '—'}
                    </span>
                    <span className="text-earth-600 shrink-0">
                      {d.properties.dealstage ?? '—'}
                      {d.properties.amount && ` · $${d.properties.amount}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : !tokenMissing ? (
        <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-4 text-center text-sm text-earth-600 mb-3">
          Pa gen yon kontak HubSpot ki match ak imèl sa.
          <br />
          Klike <strong>Sinkronize kounye a</strong> pou kreye li.
        </div>
      ) : null}

      {/* Sync log */}
      {lastLog && (
        <div className="text-[11px] text-earth-600 inline-flex items-center gap-1.5 flex-wrap">
          <Clock className="w-3 h-3" strokeWidth={2.2} />
          <span>Dènye sink:</span>
          <SyncStatusPill status={lastLog.status} />
          <span className="font-mono text-earth-500">
            {new Date(lastLog.created_at).toLocaleString(undefined, {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {lastLog.detail && (
            <span className="text-earth-500">· {lastLog.detail}</span>
          )}
        </div>
      )}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
        {label}
      </dt>
      <dd className="text-sm text-ink mt-0.5">{value}</dd>
    </div>
  );
}

function SyncStatusPill({
  status,
}: {
  status: 'ok' | 'error' | 'skipped';
}) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700">
        <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
        OK
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
        <AlertCircle className="w-2.5 h-2.5" strokeWidth={2.4} />
        Erè
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-700">
      Sote
    </span>
  );
}
