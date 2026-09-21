import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { TuitionTutorCard } from "@/components/tuition/tuition-tutor-card";
import { TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

export function TuitionIntro() {
  return (
    <section className={`px-5 ${TUITION_SECTION_SPACING}`}>
      <div className="mx-auto w-[min(760px,100%)]">
        <TuitionReveal className="text-center">
          <TuitionKicker>Who&apos;s teaching</TuitionKicker>
        </TuitionReveal>
        <TuitionReveal delayMs={80} className="mt-8">
          <TuitionTutorCard compact>
            <p className="m-0">
              I recently completed the same Higher courses my students are preparing for, achieving A grades across
              Maths, Physics, Chemistry, Biology and English. I&apos;m now studying Advanced Higher Maths, Physics
              and Chemistry, while building Orthic — a structured Scottish STEM learning platform. My lessons
              combine clear explanations with guided and independent exam-style practice.
            </p>
            <Link
              href="/tuition/about"
              className="tuition-interactive mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forge"
            >
              Read more about Finlay <ArrowRight className="tuition-arrow size-3.5" />
            </Link>
          </TuitionTutorCard>
        </TuitionReveal>
      </div>
    </section>
  );
}
