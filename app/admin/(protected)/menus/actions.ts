'use server';

// Site chrome builder — manage the public header nav, announcement bar,
// footer menus, tagline, and social links (nav_items + site_settings,
// migration 131). Admin-gated. The public side reads these via
// lib/site-chrome.ts (60s cache), so edits go live within ~a minute.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';
import { hasCapability, type AdminRole } from '../admin-nav-config';

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(row.admin_role, 'manage_guides')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou sa.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

export type ChromeNavRow = {
  id: string;
  location: 'header' | 'footer';
  group_title: string | null;
  label: string;
  url: string;
  target: '_self' | '_blank';
  display_order: number;
  active: boolean;
};

export type ChromeSettingsRow = {
  announcement_active: boolean;
  announcement_text: string | null;
  announcement_cta_label: string | null;
  announcement_cta_href: string | null;
  footer_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_email: string | null;
};

export async function listChrome(): Promise<{
  nav: ChromeNavRow[];
  settings: ChromeSettingsRow | null;
}> {
  const auth = await assertAdmin();
  if (!auth.ok) return { nav: [], settings: null };
  const [navRes, setRes] = await Promise.all([
    auth.sb
      .from('nav_items')
      .select('id, location, group_title, label, url, target, display_order, active')
      .order('location', { ascending: true })
      .order('display_order', { ascending: true }),
    auth.sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
  ]);
  return {
    nav: (navRes.data ?? []) as ChromeNavRow[],
    settings: (setRes.data ?? null) as ChromeSettingsRow | null,
  };
}

function refreshPublic() {
  // The public chrome is module-cached (60s TTL) in lib/site-chrome, so these
  // just refresh the RSC payloads; live visitors pick up changes within ~1 min.
  revalidatePath('/admin/menus');
  revalidatePath('/', 'layout');
}

export type NavItemState = { ok?: boolean; error?: string; id?: string };

export async function saveNavItem(input: {
  id?: string;
  location: 'header' | 'footer';
  group_title?: string | null;
  label: string;
  url: string;
  target: '_self' | '_blank';
  display_order?: number;
  active: boolean;
}): Promise<NavItemState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const label = input.label.trim();
  if (!label) return { error: 'Bay yon etikèt (label).' };

  const row = {
    location: input.location,
    group_title: input.location === 'footer' ? input.group_title?.trim() || 'Lyen' : null,
    label,
    url: input.url.trim() || '#',
    target: input.target === '_blank' ? '_blank' : '_self',
    display_order: Number.isFinite(input.display_order) ? Number(input.display_order) : 0,
    active: !!input.active,
    updated_at: new Date().toISOString(),
  };

  let error;
  let id = input.id;
  if (input.id) {
    ({ error } = await auth.sb.from('nav_items').update(row).eq('id', input.id));
  } else {
    const res = await auth.sb.from('nav_items').insert(row).select('id').single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) return { error: error.message };

  await logAudit(auth.sb, auth.user, {
    action: input.id ? 'update' : 'create',
    entity: 'chrome',
    entity_id: id,
    summary: `${row.location} · ${label}`,
  });
  refreshPublic();
  return { ok: true, id };
}

export async function deleteNavItem(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('nav_items').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'chrome', entity_id: id });
  refreshPublic();
  return { ok: true };
}

export async function saveSettings(input: {
  announcement_active: boolean;
  announcement_text: string;
  announcement_cta_label: string;
  announcement_cta_href: string;
  footer_tagline: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_email: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const clean = (s: string) => (s.trim() ? s.trim() : null);
  const payload = {
    id: 1,
    announcement_active: !!input.announcement_active,
    announcement_text: clean(input.announcement_text),
    announcement_cta_label: clean(input.announcement_cta_label),
    announcement_cta_href: clean(input.announcement_cta_href),
    footer_tagline: clean(input.footer_tagline),
    social_facebook: clean(input.social_facebook),
    social_instagram: clean(input.social_instagram),
    social_youtube: clean(input.social_youtube),
    social_email: clean(input.social_email),
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await auth.sb.from('site_settings').upsert(payload, { onConflict: 'id' });
  if (error) return { error: error.message };

  await logAudit(auth.sb, auth.user, {
    action: 'update',
    entity: 'chrome',
    summary: 'Anons + footer paramèt',
  });
  refreshPublic();
  return { ok: true };
}
