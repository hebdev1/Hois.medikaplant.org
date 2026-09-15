import { createClient } from '@/lib/supabase/server';
import CouponsAdmin from './coupons-admin';

export const metadata = { title: 'Admin · Koupon' };
export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('coupons')
    .select(
      'id, code, description, discount_type, amount, active, expires_at, max_uses, used_count, created_at'
    )
    .order('created_at', { ascending: false });
  return <CouponsAdmin coupons={data ?? []} />;
}
