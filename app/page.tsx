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
