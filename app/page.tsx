import { AboutBand } from "@/components/landing/about-band";
import { Courses } from "@/components/landing/courses";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { TrustBar } from "@/components/landing/trust";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <Courses />
        <AboutBand />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
