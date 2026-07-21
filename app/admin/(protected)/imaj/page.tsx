import { redirect } from 'next/navigation';
import { ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SITE_IMAGE_SLOTS, type SiteImageSlot } from '@/lib/site-image-slots';
import { getSiteImages } from '@/lib/site-images';
import ImageSlotCard from './image-slot-card';

export const metadata = { title: 'Admin · Imaj paj dakèy' };
export const dynamic = 'force-dynamic';

export default async function AdminImagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') redirect('/dashboard');

  const resolved = await getSiteImages();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase as any).from('site_images').select('key');
  const overridden = new Set(
    ((rows ?? []) as Array<{ key: string }>).map((r) => r.key)
  );

  // Group by section so the grid mirrors how the homepage reads top-to-bottom.
  const sections: { name: string; slots: SiteImageSlot[] }[] = [];
  for (const slot of SITE_IMAGE_SLOTS) {
    const last = sections[sections.length - 1];
    if (last?.name === slot.section) last.slots.push(slot);
    else sections.push({ name: slot.section, slots: [slot] });
  }

  return (
    <div className="max-w-[1200px]">
      <div className="flex items-center gap-3 mb-2">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-100 text-brand-700">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Imaj paj dakèy</h1>
          <p className="text-sm text-ink-muted">
            Chanje nenpòt imaj sou paj dakèy la san w pa bezwen yon nouvo deplwaman.
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-muted mb-8">
        {overridden.size} sou {SITE_IMAGE_SLOTS.length} imaj chanje. Klike{' '}
        <strong>Chanje</strong> pou monte yon fichye (JPG, PNG oswa WEBP, maks 8 Mo),
        oswa itilize icòn lyen an pou mete yon adrès entènèt. Icòn wonn nan remete imaj
        orijinal la.
      </p>

      {sections.map((section) => (
        <section key={section.name} className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted mb-3">
            {section.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {section.slots.map((slot) => (
              <ImageSlotCard
                key={slot.key}
                slotKey={slot.key}
                label={slot.label}
                current={resolved[slot.key]}
                overridden={overridden.has(slot.key)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
