'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

type ContactRow = Database['public']['Tables']['contact_messages']['Row'];
type ContactUpdate = Database['public']['Tables']['contact_messages']['Update'];

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const p = profile as
    | {
        role: string;
        full_name: string | null;
        first_name: string | null;
        admin_role: AdminRole | null;
      }
    | null;
  if (p?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(p.admin_role, 'manage_contact')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere mesaj kontak yo.' };
  }
  const adminName =
    p?.first_name || p?.full_name?.split(' ')[0] || 'Ekip MedikaPlant';
  return { ok: true as const, user, supabase, adminName };
}

export type ReplyResult =
  | { ok: true; row: ContactRow; emailSent: boolean; emailError?: string }
  | { ok: false; error: string };

/**
 * Send a reply to the visitor by email and mark the contact message as
 * responded. The reply body is also persisted on the row for an audit
 * trail. If RESEND_API_KEY isn't configured, we still mark the row as
 * responded (admin clearly wrote a reply) but flag emailSent=false so
 * the UI can warn them.
 */
export async function replyToContactMessage(
  id: string,
  reply: string
): Promise<ReplyResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const body = reply.trim();
  if (body.length < 10) {
    return { ok: false, error: 'Repons la twò kout (omwen 10 karaktè).' };
  }
  if (body.length > 5000) {
    return { ok: false, error: 'Repons la twò long (maks 5000 karaktè).' };
  }

  // Pull the original message so we can quote it back to the visitor.
  const { data: rowData, error: fetchError } = await auth.supabase
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !rowData) {
    return { ok: false, error: fetchError?.message ?? 'Mesaj la pa jwenn.' };
  }
  const row = rowData as ContactRow;

  // Send the email via Resend (best-effort — we still mark responded
  // even if email sending fails, so admin doesn't lose their work).
  const html = renderReplyEmail({
    toName: row.full_name,
    adminName: auth.adminName,
    originalSubject: row.subject,
    originalMessage: row.message,
    replyBody: body,
  });
  const emailRes = await sendEmail({
    to: row.email,
    subject: `Repons: ${row.subject}`,
    html,
    replyTo:
      process.env.CONTACT_REPLY_TO || process.env.EMAIL_FROM || undefined,
  });

  const update: ContactUpdate = {
    status: 'responded',
    response_body: body,
    responded_by: auth.user.id,
    responded_at: new Date().toISOString(),
  };

  const { data: updated, error } = await auth.supabase
    .from('contact_messages')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);

  return {
    ok: true,
    row: updated as ContactRow,
    emailSent: emailRes.ok,
    emailError: emailRes.ok ? undefined : emailRes.error,
  };
}

/** Move to archive (still readable but out of the inbox). */
export async function archiveContactMessage(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('contact_messages')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);
  return { ok: true };
}

/** Move back to "new" so it shows up in the active inbox again. */
export async function reopenContactMessage(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('contact_messages')
    .update({ status: 'new' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────────────
// Reply email template — quotes the original message so the visitor knows
// which inquiry this is about. Branded shell matches the rest of our
// transactional emails (lib/email/notify.ts).
// ───────────────────────────────────────────────────────────────────────────
function renderReplyEmail({
  toName,
  adminName,
  originalSubject,
  originalMessage,
  replyBody,
}: {
  toName: string;
  adminName: string;
  originalSubject: string;
  originalMessage: string;
  replyBody: string;
}): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const renderParagraphs = (text: string) =>
    text
      .split(/\n{2,}/)
      .map(
        (p) =>
          `<p style="margin:0 0 12px;color:#3f3a52;font-size:15px;line-height:1.6;">${escape(
            p
          ).replace(/\n/g, '<br/>')}</p>`
      )
      .join('');

  return `<!doctype html>
<html lang="ht">
  <body style="margin:0;padding:0;background:#f6f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5dd;">
            <tr>
              <td style="background:linear-gradient(135deg,#587d17,#354b0f);padding:24px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">MedikaPlant</span>
                <span style="color:#d0e394;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;display:block;margin-top:2px;">Hoïs Inivèsite</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;color:#050040;font-size:22px;line-height:1.3;">Bonjou ${escape(
                  toName
                )},</h1>
                <p style="margin:0 0 16px;color:#3f3a52;font-size:15px;line-height:1.6;">Mèsi paske w te kontakte nou. Men repons nou pou kesyon w an:</p>
                ${renderParagraphs(replyBody)}
                <p style="margin:24px 0 8px;color:#3f3a52;font-size:15px;line-height:1.6;">Pou nenpòt lòt kesyon, ou ka tou senpleman reponn imèl sa.</p>
                <p style="margin:0;color:#3f3a52;font-size:15px;line-height:1.6;">— ${escape(
                  adminName
                )}<br/><span style="color:#8a8699;font-size:13px;">Ekip MedikaPlant · Hoïs Inivèsite</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <div style="border:1px solid #e7e5dd;background:#f6f5f0;border-radius:12px;padding:14px 16px;">
                  <div style="color:#8a8699;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;margin-bottom:6px;">Mesaj orijinal ou</div>
                  <div style="color:#3f3a52;font-size:13px;font-weight:600;margin-bottom:6px;">${escape(
                    originalSubject
                  )}</div>
                  <div style="color:#5a5572;font-size:13px;line-height:1.5;white-space:pre-wrap;">${escape(
                    originalMessage
                  )}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px;border-top:1px solid #e7e5dd;">
                <p style="margin:0;color:#8a8699;font-size:12px;line-height:1.5;">
                  Ou resevwa imèl sa paske ou te voye yon mesaj nan paj kontak MedikaPlant la.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
