import { listChrome } from './actions';
import MenusAdmin from './menus-admin';

export const metadata = { title: 'Admin · Meni & Chrome' };
export const dynamic = 'force-dynamic';

export default async function MenusPage() {
  const { nav, settings } = await listChrome();
  return <MenusAdmin nav={nav} settings={settings} />;
}
