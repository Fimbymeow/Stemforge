import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { TUITION_CARD, TUITION_CONTAINER, TUITION_ICON, TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

export function TuitionCourses() {
  return (
    <section id="levels" className={`${TUITION_CONTAINER} ${TUITION_SECTION_SPACING}`}>
      <TuitionReveal className="text-center">
        <TuitionKicker>Our levels</TuitionKicker>
      </TuitionReveal>
      <TuitionReveal delayMs={60}>
        <h2 className={`${lora.className} mx-auto mb-12 mt-5 max-w-[620px] text-center text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.15]`}>
          Focused, in-depth tutoring for pivotal academic milestones.
        </h2>
      </TuitionReveal>
      <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {tuitionLevels.map((level, index) => (
          <TuitionReveal key={level.slug} delayMs={index * 70} className="h-full">
            <article className={`${TUITION_CARD} grid h-full content-between gap-5 overflow-hidden`}>
              <div className="p-6 pb-0">
                <div className="mb-4 flex items-center justify-between">
                  <span className={TUITION_ICON}>
                    <level.icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {level.level}
                  </span>
                </div>
                <h3 className="m-0 text-lg font-extrabold leading-tight">{level.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{level.copy}</p>
              </div>
              <div className="flex items-center justify-between border-t border-line px-6 py-4">
                <span className="text-sm font-extrabold text-ink">
                  From £{level.pricePerHour}<span className="font-semibold text-muted">/hour</span>
                </span>
                <Link
                  href={`/tuition/subjects?level=${level.slug}`}
                  className="tuition-interactive inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forge"
                >
                  View subject <ArrowRight className="tuition-arrow size-3.5" />
                </Link>
              </div>
            </article>
          </TuitionReveal>
        ))}
      </div>
    </section>
  );
}
