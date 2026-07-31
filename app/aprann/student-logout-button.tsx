'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Signs the student out of the portal and returns them to the public home.
export default function StudentLogoutButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function onSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={onSignOut} className={className}>
      <LogOut className="w-4 h-4" strokeWidth={2.2} />
      Dekonekte
    </button>
  );
}
