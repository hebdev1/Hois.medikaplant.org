// Best-effort CMS audit logging. Called from admin server actions after a
// successful mutation. It must NEVER throw — a logging failure can't be
// allowed to break the action that succeeded.

export type AuditEntry = {
  action: 'create' | 'update' | 'publish' | 'unpublish' | 'delete' | 'restore' | 'upload';
  entity:
    | 'page'
    | 'article'
    | 'video'
    | 'media'
    | 'redirect'
    | 'template'
    | 'product'
    | 'coupon'
    | 'backup';
  entity_id?: string | null;
  summary?: string | null;
};

export async function logAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  actor: { id: string; email?: string | null } | null,
  entry: AuditEntry
): Promise<void> {
  try {
    await sb.from('audit_logs').insert({
      actor_id: actor?.id ?? null,
      actor_email: actor?.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      summary: entry.summary ?? null,
    });
  } catch {
    /* swallow — logging is best-effort */
  }
}
