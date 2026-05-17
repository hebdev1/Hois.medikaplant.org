import Navbar from '@/components/ui/navbar';
import HeroSection from '@/components/ui/hero-section';
import FeaturesSection from '@/components/ui/features-section';
import AboutSection from '@/components/ui/about-section';
import PricingSection from '@/components/ui/pricing-section';
import TestimonialsSection from '@/components/ui/testimonials-section';
import CtaSection from '@/components/ui/cta-section';
import Footer from '@/components/ui/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
