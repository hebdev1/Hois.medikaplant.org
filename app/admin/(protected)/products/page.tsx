import { createClient } from '@/lib/supabase/server';
import ProductsAdmin from './products-admin';

export const metadata = { title: 'Admin · Pwodwi Shop' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('products')
    .select(
      'id, name, slug, tagline, botanical, description, price, old_price, currency, shipping_note, image_url, plan_recommendation, featured, active, updated_at'
    )
    .order('featured', { ascending: false })
    .order('name', { ascending: true });
  return <ProductsAdmin products={data ?? []} />;
}
