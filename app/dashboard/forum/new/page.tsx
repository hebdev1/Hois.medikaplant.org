import Link from 'next/link';
import { ChevronRight, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import NewTopicForm from './new-topic-form';
import type { Database } from '@/types/database';

export const metadata = { title: 'Nouvo sijè · Fowòm · MedikaPlant' };
export const dynamic = 'force-dynamic';

type Category = Database['public']['Tables']['forum_categories']['Row'];

export default async function NewTopicPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [categoriesResult, profileResult] = await Promise.all([
    supabase
      .from('forum_categories')
      .select('*')
      .order('display_order'),
    supabase
      .from('profiles')
      .select('full_name, suspended')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  const profile = profileResult.data as {
    full_name: string | null;
    suspended: boolean;
  } | null;

  if (profile?.suspended) {
    return (
      <>
        <Topbar
          userName={profile.full_name?.split(' ')[0] ?? 'Manm'}
          userCondition="Fowòm"
        />
        <div className="p-8 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            Kont ou sispann. Ou pa ka kreye yon nouvo sijè kounye a.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        userName={profile?.full_name?.split(' ')[0] ?? 'Manm'}
        userCondition="Fowòm · Nouvo sijè"
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[760px] mx-auto grid gap-5">
        <nav className="text-xs text-earth-600 flex items-center gap-1.5">
          <Link href="/dashboard" className="hover:text-forest-700 transition">
            Tablodebò
          </Link>
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
          <Link href="/dashboard/forum" className="hover:text-forest-700 transition">
            Fowòm
          </Link>
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
          <span className="text-ink font-medium">Nouvo sijè</span>
        </nav>

        <Link
          href="/dashboard/forum"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Tounen
        </Link>

        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <MessageSquarePlus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Nouvo sijè
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
            Kòmanse yon{' '}
            <em className="text-forest-600 not-italic font-bold">konvèsasyon</em>
          </h1>
          <p className="mt-2 text-sm text-earth-600 leading-relaxed">
            Pataje yon kesyon, yon eksperyans, oswa yon konsèy ak rès kominote
            a. Chwazi yon kategori ki kòrèk pou ede lòt manm yo jwenn sijè w.
          </p>
        </header>

        <NewTopicForm categories={categories} />
      </div>
    </>
  );
}
