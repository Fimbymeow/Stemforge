import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

export function TuitionCourses() {
  return (
    <section id="levels" className="mx-auto w-[min(1120px,calc(100%_-_40px))] py-20">
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
            <article className="grid h-full content-between gap-5 overflow-hidden rounded-[6px] border border-line bg-white transition duration-300 ease-out hover:-translate-y-1 hover:border-forge/50 hover:shadow-card">
              <div className="p-6 pb-0">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-lg bg-forge-soft text-forge">
                    <level.icon className="size-5" />
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-extrabold uppercase text-muted">
                    {level.level}
                  </span>
                </div>
                <h3 className="m-0 text-lg font-extrabold leading-tight">{level.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{level.copy}</p>
              </div>
              <div className="flex items-center justify-between border-t border-line bg-paper px-6 py-4">
                <span className="text-sm font-extrabold text-ink">
                  From £{level.pricePerHour}<span className="font-semibold text-muted">/hour</span>
                </span>
                <Link
                  href={`/tuition/subjects?level=${level.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-extrabold text-warning"
                >
                  Learn more <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          </TuitionReveal>
        ))}
      </div>
    </section>
  );
}
