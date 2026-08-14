import type { Metadata } from "next";
import { Courses } from "@/components/landing/courses";
import { CourseProof } from "@/components/landing/course-proof";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <CourseProof />
        <Courses />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
