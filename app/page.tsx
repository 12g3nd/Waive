import { SAMPLES } from "@/samples";
import type { SampleCard } from "@/lib/api-types";
import { SiteNav } from "@/components/landing/site-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { DifferentiatorSection } from "@/components/landing/differentiator-section";
import { SampleCtaSection } from "@/components/landing/sample-cta-section";
import { TrustSection } from "@/components/landing/trust-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  const samples: SampleCard[] = SAMPLES.map((s) => ({
    id: s.id,
    packId: s.packId,
    title: s.title,
    blurb: s.blurb,
    badge: s.badge,
    tone: s.tone,
    imagePath: s.imagePath,
  }));

  return (
    <div className="min-h-screen bg-paper">
      <SiteNav />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <DifferentiatorSection />
      <SampleCtaSection samples={samples} />
      <TrustSection />
      <SiteFooter />
    </div>
  );
}
