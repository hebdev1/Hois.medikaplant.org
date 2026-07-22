import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Confirmation landing for email links that complete server-side — chiefly an
// email change. Supabase mails a link here with token_hash + type; we exchange
// it via verifyOtp() (which actually applies the change) and then redirect to
// `next`. Recovery/magic-link keep their own client-side flow.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next');

  const site = (process.env.NEXT_PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
  const dest = new URL(
    `${site}${next && next.startsWith('/') ? next : '/dashboard/settings'}`
  );

  if (!tokenHash || !type) {
    dest.searchParams.set('imel_error', '1');
    return NextResponse.redirect(dest);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  dest.searchParams.set(error ? 'imel_error' : 'imel_ok', '1');
  return NextResponse.redirect(dest);
}
