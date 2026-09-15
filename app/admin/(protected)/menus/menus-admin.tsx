'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  PanelsTopLeft,
  Megaphone,
  ListTree,
  PanelBottom,
  Plus,
  Loader2,
  X,
  Trash2,
  ExternalLink,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/cvui-badge';
import {
  saveNavItem,
  deleteNavItem,
  saveSettings,
  type ChromeNavRow,
  type ChromeSettingsRow,
} from './actions';

type Tab = 'header' | 'footer';

export default function MenusAdmin({
  nav,
  settings,
}: {
  nav: ChromeNavRow[];
  settings: ChromeSettingsRow | null;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>('header');
  const [editing, setEditing] = React.useState<
    | { item: ChromeNavRow | null; location: Tab; group: string }
    | null
  >(null);

  const headerItems = nav
    .filter((n) => n.location === 'header')
    .sort((a, b) => a.display_order - b.display_order);

  const footerItems = nav.filter((n) => n.location === 'footer');
  const footerGroups: { title: string; items: ChromeNavRow[] }[] = [];
  for (const it of footerItems.sort((a, b) => a.display_order - b.display_order)) {
    const key = it.group_title || 'Lyen';
    let g = footerGroups.find((x) => x.title === key);
    if (!g) {
      g = { title: key, items: [] };
      footerGroups.push(g);
    }
    g.items.push(it);
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <PanelsTopLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
          Konsepsyon · Chrome
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Meni, Header &amp; Footer
        </h1>
        <p className="mt-1.5 text-sm text-earth-600 max-w-2xl">
          Jere bann anons lan, meni antèt la, ak footer sit piblik la. Chanjman yo
          parèt sou sit la nan anviwon 1 minit.
        </p>
      </header>

      {/* Tabs */}
      <nav className="mb-6 inline-flex p-1 bg-cream-100 border border-cream-200 rounded-2xl">
        {([
          { key: 'header', label: 'Header & Anons', icon: Megaphone },
          { key: 'footer', label: 'Footer', icon: PanelBottom },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition',
              tab === key ? 'bg-white text-forest-800 shadow-sm' : 'text-earth-700 hover:text-ink'
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'header' && (
        <div className="space-y-6">
          <AnnouncementCard settings={settings} onSaved={() => router.refresh()} />
          <MenuCard
            title="Meni antèt"
            subtitle="Lyen navigasyon anwo sit la."
            items={headerItems}
            onAdd={() => setEditing({ item: null, location: 'header', group: '' })}
            onEdit={(it) => setEditing({ item: it, location: 'header', group: it.group_title || '' })}
          />
        </div>
      )}

      {tab === 'footer' && (
        <div className="space-y-6">
          <FooterContentCard settings={settings} onSaved={() => router.refresh()} />
          <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 md:px-5 py-3.5 border-b border-cream-200">
              <div className="inline-flex items-center gap-2">
                <ListTree className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
                <h3 className="font-display text-sm font-bold text-ink">Meni footer (pa kolòn)</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing({ item: null, location: 'footer', group: '' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 text-white text-xs font-bold hover:bg-forest-800 transition"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.6} /> Ajoute lyen
              </button>
            </header>
            {footerGroups.length === 0 ? (
              <div className="p-8 text-center text-sm text-earth-500">
                Poko gen lyen footer. Sit la ap sèvi ak lis pa defo a.
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {footerGroups.map((g) => (
                  <div key={g.title} className="p-4 md:p-5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500 mb-2">
                      {g.title}
                    </div>
                    <ul className="space-y-1.5">
                      {g.items.map((it) => (
                        <NavRow
                          key={it.id}
                          item={it}
                          onEdit={() =>
                            setEditing({ item: it, location: 'footer', group: it.group_title || '' })
                          }
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <NavModal
          item={editing.item}
          location={editing.location}
          defaultGroup={editing.group}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── Menu list card (header) ─────────────────────────────────────────────────
function MenuCard({
  title,
  subtitle,
  items,
  onAdd,
  onEdit,
}: {
  title: string;
  subtitle: string;
  items: ChromeNavRow[];
  onAdd: () => void;
  onEdit: (it: ChromeNavRow) => void;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-4 md:px-5 py-3.5 border-b border-cream-200">
        <div className="inline-flex items-center gap-2">
          <ListTree className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
          <div>
            <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            <p className="text-[11px] text-earth-500">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 text-white text-xs font-bold hover:bg-forest-800 transition"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.6} /> Ajoute lyen
        </button>
      </header>
      {items.length === 0 ? (
        <div className="p-8 text-center text-sm text-earth-500">
          Poko gen lyen. Sit la ap sèvi ak meni pa defo a.
        </div>
      ) : (
        <ul className="divide-y divide-cream-100 p-2">
          {items.map((it) => (
            <NavRow key={it.id} item={it} onEdit={() => onEdit(it)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NavRow({ item, onEdit }: { item: ChromeNavRow; onEdit: () => void }) {
  return (
    <li className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-cream-50">
      <span className="font-mono text-[11px] text-earth-400 w-6 text-center shrink-0">
        {item.display_order}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink text-sm truncate">{item.label}</span>
          {item.target === '_blank' && (
            <ExternalLink className="w-3 h-3 text-earth-400 shrink-0" strokeWidth={2.2} />
          )}
          {!item.active && (
            <Badge label="Kache" variant="secondary" appearance="subtle" size="small" />
          )}
        </div>
        <div className="text-[11px] text-earth-500 font-mono truncate">{item.url}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition shrink-0"
      >
        Modifye
      </button>
    </li>
  );
}

// ── Announcement editor ─────────────────────────────────────────────────────
function AnnouncementCard({
  settings,
  onSaved,
}: {
  settings: ChromeSettingsRow | null;
  onSaved: () => void;
}) {
  return (
    <SettingsForm settings={settings} onSaved={onSaved} mode="announcement" />
  );
}

function FooterContentCard({
  settings,
  onSaved,
}: {
  settings: ChromeSettingsRow | null;
  onSaved: () => void;
}) {
  return <SettingsForm settings={settings} onSaved={onSaved} mode="footer" />;
}

function SettingsForm({
  settings,
  onSaved,
  mode,
}: {
  settings: ChromeSettingsRow | null;
  onSaved: () => void;
  mode: 'announcement' | 'footer';
}) {
  const [s, setS] = React.useState({
    announcement_active: settings?.announcement_active ?? true,
    announcement_text: settings?.announcement_text ?? '',
    announcement_cta_label: settings?.announcement_cta_label ?? '',
    announcement_cta_href: settings?.announcement_cta_href ?? '',
    footer_tagline: settings?.footer_tagline ?? '',
    social_facebook: settings?.social_facebook ?? '',
    social_instagram: settings?.social_instagram ?? '',
    social_youtube: settings?.social_youtube ?? '',
    social_email: settings?.social_email ?? '',
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const set = (k: keyof typeof s, v: string | boolean) => setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await saveSettings(s);
    setBusy(false);
    if (res.ok) {
      setMsg('Anrejistre ✓');
      onSaved();
      setTimeout(() => setMsg(null), 2500);
    } else setErr(res.error ?? 'Echwe.');
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';
  const lbl = 'text-[11px] font-bold uppercase tracking-wider text-earth-600';

  return (
    <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {mode === 'announcement' ? (
          <Megaphone className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        ) : (
          <PanelBottom className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        )}
        <h3 className="font-display text-sm font-bold text-ink">
          {mode === 'announcement' ? 'Bann anons (anwo sit la)' : 'Kontni footer'}
        </h3>
      </div>

      {mode === 'announcement' ? (
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.announcement_active}
              onChange={(e) => set('announcement_active', e.target.checked)}
              className="w-4 h-4 rounded border-cream-300 text-forest-600 focus:ring-forest-200"
            />
            <span className="text-sm font-semibold text-ink">Montre bann anons lan</span>
          </label>
          <label className="block">
            <span className={lbl}>Tèks</span>
            <input
              value={s.announcement_text}
              onChange={(e) => set('announcement_text', e.target.value)}
              className={inputCls}
              placeholder="Vin enskri kòm manb jodi a…"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>Tèks bouton</span>
              <input
                value={s.announcement_cta_label}
                onChange={(e) => set('announcement_cta_label', e.target.value)}
                className={inputCls}
                placeholder="Wè pri yo"
              />
            </label>
            <label className="block">
              <span className={lbl}>Lyen bouton</span>
              <input
                value={s.announcement_cta_href}
                onChange={(e) => set('announcement_cta_href', e.target.value)}
                className={`${inputCls} font-mono text-xs`}
                placeholder="#pri"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className={lbl}>Deskripsyon mak la</span>
            <textarea
              value={s.footer_tagline}
              onChange={(e) => set('footer_tagline', e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Platfòm natiropatik #1…"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>Facebook</span>
              <input value={s.social_facebook} onChange={(e) => set('social_facebook', e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="https://facebook.com/…" />
            </label>
            <label className="block">
              <span className={lbl}>Instagram</span>
              <input value={s.social_instagram} onChange={(e) => set('social_instagram', e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="https://instagram.com/…" />
            </label>
            <label className="block">
              <span className={lbl}>YouTube</span>
              <input value={s.social_youtube} onChange={(e) => set('social_youtube', e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="https://youtube.com/@…" />
            </label>
            <label className="block">
              <span className={lbl}>Imèl</span>
              <input value={s.social_email} onChange={(e) => set('social_email', e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="mailto:plant@medikaplant.org" />
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2.2} />}
          Anrejistre
        </button>
        {msg && <span className="text-sm text-forest-700 font-semibold">{msg}</span>}
        {err && <span className="text-sm text-rose-700">{err}</span>}
      </div>
    </div>
  );
}

// ── Nav item modal ──────────────────────────────────────────────────────────
function NavModal({
  item,
  location,
  defaultGroup,
  onClose,
  onChanged,
}: {
  item: ChromeNavRow | null;
  location: Tab;
  defaultGroup: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [label, setLabel] = React.useState(item?.label ?? '');
  const [url, setUrl] = React.useState(item?.url ?? '');
  const [target, setTarget] = React.useState<'_self' | '_blank'>(item?.target ?? '_self');
  const [group, setGroup] = React.useState(defaultGroup);
  const [order, setOrder] = React.useState(String(item?.display_order ?? 0));
  const [active, setActive] = React.useState(item?.active ?? true);
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await saveNavItem({
      id: item?.id,
      location,
      group_title: location === 'footer' ? group : null,
      label,
      url,
      target,
      display_order: Number(order) || 0,
      active,
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    if (!item?.id) return;
    setBusy(true);
    const res = await deleteNavItem(item.id);
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';
  const lbl = 'text-[11px] font-bold uppercase tracking-wider text-earth-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fèmen" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100">
          <h2 className="font-display text-lg font-bold text-ink">
            {item ? 'Modifye lyen' : 'Nouvo lyen'} · {location === 'header' ? 'Header' : 'Footer'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fèmen" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block">
            <span className={lbl}>Etikèt</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Akèy" />
          </label>
          <label className="block">
            <span className={lbl}>Lyen (URL)</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="/glose oswa https://…" />
          </label>
          {location === 'footer' && (
            <label className="block">
              <span className={lbl}>Kolòn (tit gwoup)</span>
              <input value={group} onChange={(e) => setGroup(e.target.value)} className={inputCls} placeholder="Pwodui, Konpayi…" />
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>Kote li ouvri</span>
              <select value={target} onChange={(e) => setTarget(e.target.value as '_self' | '_blank')} className={inputCls}>
                <option value="_self">Menm paj</option>
                <option value="_blank">Nouvo onglè</option>
              </select>
            </label>
            <label className="block">
              <span className={lbl}>Lòd</span>
              <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded border-cream-300 text-forest-600 focus:ring-forest-200" />
            <span className="text-sm font-semibold text-ink">Aktif (vizib)</span>
          </label>

          {err && <p className="text-xs text-rose-700">{err}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {item ? (
              !confirmDel ? (
                <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-sm font-semibold transition">
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} /> Efase
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button type="button" onClick={remove} disabled={busy} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60">Konfime</button>
                  <button type="button" onClick={() => setConfirmDel(false)} className="px-2 text-sm text-earth-500">Anile</button>
                </span>
              )
            ) : (
              <span />
            )}
            <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Anrejistre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
