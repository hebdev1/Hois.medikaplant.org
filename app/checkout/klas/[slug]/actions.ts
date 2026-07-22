'use server';

import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site-url';
import { startCourseCheckout } from '@/app/checkout/stripe-actions';

// Course checkout — anyone (subscribed or not) can buy a paid course.
// Pattern mirrors /checkout/actions.ts (login OR signup OR already-in) but
// skips plan selection. This action authenticates and checks seats, then
// hands off to Stripe; the purchase and enrolment are recorded by the
// webhook once Stripe confirms payment.

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
  seat_capacity: number | null;
};

async function loadCourse(slug: string): Promise<Course | null> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from('courses')
    .select('id, slug, title, price_cents, active, seat_capacity')
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

  // ── 2. Auth — login OR signup OR already signed-in ────────────────────
  // No card validation here any more: the card is entered on Stripe's page,
  // so no card data is ever submitted to this action.
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

  // ── 3. Seat check, then hand off to Stripe ────────────────────────────
  // The purchase itself is recorded by the webhook, so the old
  // purchase_course RPC can no longer run it — that function derives the
  // buyer from auth.uid(), which does not exist in a webhook request.
  //
  // Its seat-cap check still matters though, so do it HERE, before taking
  // any money: refusing a full class up front is far better than charging
  // someone and failing to enrol them.
  if (course.seat_capacity != null) {
    const { count } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id);
    if ((count ?? 0) >= course.seat_capacity) {
      return {
        error: `Klas la deja konplè (${course.seat_capacity} plas).`,
      };
    }
  }

  const session = await startCourseCheckout(course.id);
  if (session.error || !session.url) {
    return { error: session.error ?? 'Peman an pa ka kòmanse.' };
  }

  return { redirectTo: session.url };
}
