import type { Metadata } from "next";
import { TuitionCourses } from "@/components/tuition/tuition-courses";
import { TuitionCta } from "@/components/tuition/tuition-cta";
import { TuitionDifference } from "@/components/tuition/tuition-difference";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionHero } from "@/components/tuition/tuition-hero";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";
import { TuitionTestimonials } from "@/components/tuition/tuition-testimonials";

export const metadata: Metadata = {
  title: "Tuition",
  description: "Specialist one-to-one tuition in National 5 and Higher Maths and Physics, from the team behind STEM Forge.",
};

export default function TuitionPage() {
  return (
    <>
      <TuitionNavbar />
      <main>
        <TuitionHero />
        <TuitionCourses />
        <TuitionDifference />
        <TuitionTestimonials />
        <TuitionCta />
      </main>
      <TuitionFooter />
    </>
  );
}
