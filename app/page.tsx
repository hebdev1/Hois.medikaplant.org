import PromoteHeader from '@/components/ui/promote-header';
import HeroSection from '@/components/ui/hero-section';
import FeaturesSection from '@/components/ui/features-section';
import AboutSection from '@/components/ui/about-section';
import HoisSection from '@/components/ui/hois-section';
import PricingSection from '@/components/ui/pricing-section';
import TestimonialsSection from '@/components/ui/testimonials-section';
import CtaSection from '@/components/ui/cta-section';
import Footer from '@/components/ui/footer';
import { getSiteImages, imageKeys } from '@/lib/site-images';

// Homepage content (site images, marketing copy) changes rarely and is the
// same for everyone, so serve it from a static ISR cache instead of rendering
// it on every visit. This is what takes TTFB from ~1.4s down to tens of ms.
//
// The image action calls revalidatePath('/') to refresh instantly on save, but
// on-demand revalidation is unreliable on Hostinger's `next start` (the cache
// isn't reliably purged), so an admin's new /admin/imaj image could sit unseen
// behind the cache for the full window. Keeping the window short (60s, was
// 600s) bounds that to ~1 minute while the page stays cache-served for ~59s of
// every 60 — so image swaps show up promptly without giving up the speed.
export const revalidate = 60;

export default async function HomePage() {
  // Admin-managed graphics (/admin/imaj). Unset slots fall back to the
  // defaults compiled into lib/site-image-slots.ts.
  const siteImages = await getSiteImages();

  return (
    <main className="min-h-screen bg-white">
      <PromoteHeader />
      <HeroSection images={imageKeys('hero').map((k) => siteImages[k])} />
      <FeaturesSection />
      <AboutSection />
      <HoisSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
