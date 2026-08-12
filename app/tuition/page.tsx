import type { Metadata } from "next";
import { TuitionCourses } from "@/components/tuition/tuition-courses";
import { TuitionCta } from "@/components/tuition/tuition-cta";
import { TuitionDifference } from "@/components/tuition/tuition-difference";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionHero } from "@/components/tuition/tuition-hero";
import { TuitionIntro } from "@/components/tuition/tuition-intro";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";
import { TuitionTestimonials } from "@/components/tuition/tuition-testimonials";

export const metadata: Metadata = {
  title: "Tuition",
  description:
    "One-to-one National 5 and Higher Maths and Physics tuition from Finlay Kennedy, who achieved A grades across five Highers and is building Orthic.",
};

export default function TuitionPage() {
  return (
    <>
      <TuitionNavbar />
      <main>
        <TuitionHero />
        <TuitionCourses />
        <TuitionDifference />
        <TuitionIntro />
        <TuitionTestimonials />
        <TuitionCta />
      </main>
      <TuitionFooter />
    </>
  );
}
