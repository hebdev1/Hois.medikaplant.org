import { ScrollText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin · Jounal odit' };
export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  create: 'Kreye',
  update: 'Modifye',
  publish: 'Pibliye',
  unpublish: 'Retire',
  delete: 'Efase',
  restore: 'Restore',
  upload: 'Upload',
};
const ACTION_TONE: Record<string, string> = {
  create: 'bg-forest-100 text-forest-700',
  publish: 'bg-forest-100 text-forest-700',
  update: 'bg-cream-200 text-earth-700',
  unpublish: 'bg-cream-200 text-earth-700',
  restore: 'bg-gold-100 text-gold-700',
  upload: 'bg-cream-200 text-earth-700',
  delete: 'bg-rose-100 text-rose-700',
};
const ENTITY_LABEL: Record<string, string> = {
  page: 'Paj',
  article: 'Atik',
  video: 'Videyo',
  media: 'Medya',
  redirect: 'Redireksyon',
  template: 'Modèl',
};

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
};

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AuditPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('audit_logs')
    .select('id, actor_email, action, entity, entity_id, summary, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <ScrollText className="w-3.5 h-3.5" strokeWidth={2.2} />
          Sistèm · Jounal odit
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Jounal odit
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Dènye {rows.length} aksyon CMS yo (kreye, modifye, pibliye, efase…).
        </p>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen aktivite anrejistre.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 md:px-5 py-3 text-sm">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                    ACTION_TONE[r.action] ?? 'bg-cream-200 text-earth-700'
                  }`}
                >
                  {ACTION_LABEL[r.action] ?? r.action}
                </span>
                <span className="text-earth-500 shrink-0 w-16">
                  {ENTITY_LABEL[r.entity] ?? r.entity}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">
                  {r.summary || r.entity_id || '—'}
                </span>
                <span className="hidden sm:block text-xs text-earth-500 truncate max-w-[160px]">
                  {r.actor_email ?? ''}
                </span>
                <span className="text-[11px] text-earth-400 font-mono shrink-0">
                  {fmt(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
