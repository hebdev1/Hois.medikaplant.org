import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';
import CareTabBar, { type CareTab } from './tab-bar';
import PatientsView from './patients-view';
import SegmentsView from './segments-view';
import ProgramsView from './programs-view';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Swivi Sante' };
export const dynamic = 'force-dynamic';

const TAB_TITLE: Record<CareTab, { eyebrow: string; title: string; lead: string }> = {
  patients: {
    eyebrow: 'Pasyan & Mezi',
    title: 'Pasyan & Mezi',
    lead: 'Swiv mezi sante manm yo an direk. Klike sou yon liy pou ouvri pwofil klinik konplè a epi pwopoze yon medikaman, tizan, oswa chanjman abitid.',
  },
  segments: {
    eyebrow: 'Segman maladi',
    title: 'Manm yo gwoupe pa maladi',
    lead: 'Chak segman gwoupe otomatikman tout manm ki gen menm kondisyon sante. Klike sou yon segman pou wè detay manm yo + voye yon notifikasyon.',
  },
  programs: {
    eyebrow: 'Plan + Tach 1-30',
    title: 'Pwograme tach plan yo',
    lead: 'Chwazi yon plan pou wè kalandriye 1-30 jou a. Pou chak jou, ou ka ajoute tach ki pèsonalize selon kondisyon sante manm yo.',
  },
};

function normalizeTab(raw?: string): CareTab {
  if (raw === 'segments' || raw === 'programs' || raw === 'patients') {
    return raw;
  }
  return 'patients';
}

export default async function AdminCarePage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; condition?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'view_health')) {
    redirect('/admin');
  }

  const active = normalizeTab(searchParams.tab);
  const meta = TAB_TITLE[active];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Activity className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Swivi Sante · {meta.eyebrow}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">{meta.lead}</p>
      </header>

      <CareTabBar active={active} />

      {active === 'patients' && (
        <PatientsView q={searchParams.q} condition={searchParams.condition} />
      )}
      {active === 'segments' && <SegmentsView />}
      {active === 'programs' && <ProgramsView />}
    </div>
  );
}
