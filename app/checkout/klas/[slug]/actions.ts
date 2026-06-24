'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site-url';

// Course checkout — anyone (subscribed or not) can buy a paid course.
// Pattern mirrors /checkout/actions.ts (login OR signup OR already-in)
// but skips the plan selection. Mock card validation since the rest of
// the app still uses the mock-pay path.

export type CourseCheckoutState = {
  error?: string;
  switchToLogin?: boolean;
  redirectTo?: string;
};

type Course = {
  id: string;
  slug: string;
  title: string;
  price_cents: number | null;
  active: boolean;
};

async function loadCourse(slug: string): Promise<Course | null> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('courses')
    .select('id, slug, title, price_cents, active')
    .eq('slug', slug)
    .maybeSingle();
  return (data ?? null) as Course | null;
}

export async function processCourseCheckout(
  slug: string,
  _prev: CourseCheckoutState,
  formData: FormData
): Promise<CourseCheckoutState> {
  // ── 1. Course must exist + be sellable ────────────────────────────────
  const course = await loadCourse(slug);
  if (!course) return { error: 'Klas la pa egziste.' };
  if (!course.active) return { error: 'Klas sa a poko aktif.' };
  if (!course.price_cents || course.price_cents <= 0) {
    return {
      error: 'Klas sa a enkli nan abònman — pa gen achte separe.',
    };
  }

  // ── 2. Mock card validation (same shape as plan checkout) ─────────────
  const cardholderName = formData.get('cardholder_name')?.toString().trim() ?? '';
  const cardNumber = formData.get('card_number')?.toString().replace(/\s+/g, '') ?? '';
  const expiry = formData.get('expiry')?.toString().trim() ?? '';
  const cvc = formData.get('cvc')?.toString().trim() ?? '';

  if (!cardholderName || cardholderName.length < 2) {
    return { error: 'Tanpri antre non sou kat la.' };
  }
  if (!/^\d{13,19}$/.test(cardNumber)) {
    return { error: 'Nimewo kat la pa valid.' };
  }
  if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(expiry)) {
    return { error: 'Dat ekspirasyon an pa valid (MM/YY).' };
  }
  if (!/^\d{3,4}$/.test(cvc)) {
    return { error: 'Kòd CVC la pa valid.' };
  }

  // ── 3. Auth — login OR signup OR already signed-in ────────────────────
  const supabase = createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const mode = formData.get('mode')?.toString() ?? 'login';
    const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    if (!email || !password) {
      return { error: 'Imel ak modpas obligatwa.' };
    }
    if (password.length < 6) {
      return { error: 'Modpas la dwe gen omwen 6 karaktè.' };
    }

    if (mode === 'signup') {
      const firstName = formData.get('first_name')?.toString().trim() ?? '';
      const lastName = formData.get('last_name')?.toString().trim() ?? '';
      if (firstName.length < 2 || lastName.length < 2) {
        return { error: 'Antre prenon ak non w nèt.' };
      }
      const fullName = `${firstName} ${lastName}`.trim();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            intended_course: slug,
          },
          // After confirming email they come back to the same checkout
          // so they can finalize payment.
          emailRedirectTo: siteUrl(`/checkout/klas/${slug}`),
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('user already')
        ) {
          return {
            error:
              'Yon kont ak imel sa egziste deja. Konekte ak modpas ou pi ba a.',
            switchToLogin: true,
          };
        }
        return { error: signUpError.message };
      }
      if (!signUpData.user) {
        return { error: 'Kreyasyon kont lan pa pase. Eseye ankò.' };
      }
      if (!signUpData.session) {
        return {
          error:
            'Tcheke imel ou pou konfime kont lan, apre sa retounen pou peye klas la.',
        };
      }
      user = signUpData.user;
    } else {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !signInData.user) {
        return { error: 'Imel oswa modpas pa kòrèk.' };
      }
      user = signInData.user;
    }
  }

  // ── 4. Persist purchase + grant enrollment via the SECURITY DEFINER RPC
  // The RPC re-derives the price from the DB (we never trust client
  // amounts) and is responsible for the seat-cap check + idempotent
  // enrollment row.
  const paymentReference = `mock_klas_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: result, error: rpcError } = await sb.rpc('purchase_course', {
    p_course_id: course.id,
    p_amount_cents: course.price_cents,
    p_payment_reference: paymentReference,
  });
  if (rpcError) {
    return { error: `Pèman pa pase: ${rpcError.message}` };
  }
  const res = result as
    | { ok: true }
    | { ok: false; error: string; capacity?: number; expected?: number };
  if (!res?.ok) {
    switch (res?.error) {
      case 'course_full':
        return {
          error: `Klas la deja konplè (${res.capacity ?? ''} plas). Achat anile.`,
        };
      case 'amount_mismatch':
        return {
          error:
            'Pri klas la chanje pandan w t ap peye. Aktyalize paj la epi eseye ankò.',
        };
      case 'not_purchasable':
        return { error: 'Klas sa a pa disponib pou achte separe.' };
      case 'course_inactive':
        return { error: 'Klas sa a poko aktif.' };
      default:
        return { error: res?.error ?? 'Pèman pa pase.' };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath(`/klas/${slug}`);
  return { redirectTo: `/klas/${slug}?purchased=1` };
}
