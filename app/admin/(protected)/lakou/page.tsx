import { listLakouTabs } from './actions';
import LakouAdmin from './lakou-admin';

export const metadata = { title: 'Admin · Lakou Limyè' };
export const dynamic = 'force-dynamic';

export default async function LakouPage() {
  const tabs = await listLakouTabs();
  return <LakouAdmin tabs={tabs} />;
}
