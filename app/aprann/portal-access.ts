'use server';

import { createClient } from '@/lib/supabase/server';

// The student portal (/aprann) is for course buyers only. This action tells the
// public header whether to show the "Potay etidyan" button:
//
//   • logged OUT  → show it. It's the buyer's way IN: it routes to /aprann,
//     which bounces to login and back. (A non-member course buyer can't use
//     the generic "Konekte" button, since that lands on /dashboard and the
//     plan gate turns them away — so this button is their only door.)
//   • logged IN + owns ≥1 course → show it.
//   • logged IN + owns no course → hide it (they aren't a student).
export async function studentPortalNav(): Promise<{
  show: boolean;
  loggedIn: boolean;
  isAdmin: boolean;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { show: true, loggedIn: false, isAdmin: false };

  const [enrollRes, roleRes] = await Promise.all([
    supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);
  const isAdmin =
    (roleRes.data as { role?: string } | null)?.role === 'admin';
  return { show: (enrollRes.count ?? 0) > 0, loggedIn: true, isAdmin };
}
