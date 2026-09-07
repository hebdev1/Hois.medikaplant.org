import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sprout, Leaf, Stethoscope, Inbox, ExternalLink, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Laboratwa' };
export const dynamic = 'force-dynamic';

export default async function AdminLaboratwaHub() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  const { data: prof } = await supabase.from('profiles').select('admin_role').eq('id', user.id).maybeSingle();
  const role = (prof as { admin_role: AdminRole | null } | null)?.admin_role;
  if (!hasCapability(role, 'manage_guides')) redirect('/admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const [plants, conds, pending] = await Promise.all([
    db.from('plants').select('id', { count: 'exact', head: true }),
    db.from('lab_conditions').select('id', { count: 'exact', head: true }),
    db.from('contributions').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  const cards = [
    { href: '/admin/laboratwa/plant', icon: Leaf, title: 'Plant yo', desc: 'Ajoute, modifye non, pati, preparasyon, sipò tradisyonèl ak prekosyon.', badge: `${plants.count ?? 0} plant` },
    { href: '/admin/laboratwa/kondisyon', icon: Stethoscope, title: 'Maladi & Plant', desc: 'Kondisyon yo ak plant TRAMIL rekòmande, drapo wouj ak preparasyon.', badge: `${conds.count ?? 0} kondisyon` },
    { href: '/admin/laboratwa/kontribisyon', icon: Inbox, title: 'Kontribisyon', desc: 'Revize non lokal, nòt ak foto moun voye.', badge: `${pending.count ?? 0} k ap tann` },
  ];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
          <Sprout className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Laboratwa
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Jere <em className="text-forest-600 not-italic font-bold">Laboratwa a</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Tout kontni Laboratwa a modifyab isit la. Chanjman yo parèt sou paj piblik la
          (jiska ~1 minit pou kachè a rafrechi).
        </p>
        <Link href="/laboratwa" target="_blank"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-earth-700 hover:text-forest-700 border border-cream-200 rounded-lg px-3 py-2">
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} /> Wè paj piblik la
        </Link>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}
            className="group bg-white border border-cream-200 rounded-2xl shadow-card p-5 hover:border-forest-300 transition flex flex-col">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-forest-100 text-forest-700 mb-3">
              <c.icon className="w-5 h-5" strokeWidth={2} />
            </span>
            <div className="font-display text-lg font-bold text-ink">{c.title}</div>
            <p className="text-sm text-earth-600 mt-1 flex-1">{c.desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-earth-500">{c.badge}</span>
              <ArrowRight className="w-4 h-4 text-earth-400 group-hover:text-forest-700 transition" strokeWidth={2.2} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
