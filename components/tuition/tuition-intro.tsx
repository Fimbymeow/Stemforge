import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TuitionAvatarPlaceholder } from "@/components/tuition/tuition-avatar";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

export function TuitionIntro() {
  return (
    <section className="border-b border-line bg-white px-5 py-20">
      <div className="mx-auto w-[min(760px,100%)]">
        <TuitionReveal className="text-center">
          <TuitionKicker>Who&apos;s teaching</TuitionKicker>
        </TuitionReveal>
        <TuitionReveal delayMs={80} className="mt-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <TuitionAvatarPlaceholder size="lg" />
          <div>
            <h2 className={`${lora.className} m-0 text-2xl font-bold`}>Finlay Kennedy</h2>
            <p className="mt-3 leading-relaxed text-muted">
              I recently completed the same Higher courses my students are preparing for, achieving A grades across
              Maths, Physics, Chemistry, Biology and English. I&apos;m now studying Advanced Higher Maths, Physics
              and Chemistry, while building Orthic — a structured Scottish STEM learning platform. My lessons
              combine clear explanations with guided and independent exam-style practice.
            </p>
            <Link
              href="/tuition/about"
              className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-warning"
            >
              Read more about Finlay <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </TuitionReveal>
      </div>
    </section>
  );
}
