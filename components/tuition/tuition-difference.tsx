import { BookOpen, Compass, Target, TrendingUp } from "lucide-react";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

const points = [
  {
    icon: Target,
    title: "Personalised learning",
    copy: "Bespoke lessons addressing your specific weaknesses and pushing your boundaries.",
  },
  {
    icon: BookOpen,
    title: "Deep understanding",
    copy: "Go beyond rote memorisation to build a genuine grasp of the method, not just the answer.",
  },
  {
    icon: Compass,
    title: "Exam-focused",
    copy: "Strategic preparation tailored to the National 5 and Higher SQA specifications.",
  },
  {
    icon: TrendingUp,
    title: "Built on real practice",
    copy: "Every session complements the same structured, worked-solution practice behind STEM Forge.",
  },
] as const;

export function TuitionDifference() {
  return (
    <section className="bg-forge-soft/40 px-5 py-20">
      <div className="mx-auto w-[min(1000px,100%)]">
        <TuitionReveal className="text-center">
          <TuitionKicker>The STEM Forge difference</TuitionKicker>
        </TuitionReveal>
        <TuitionReveal delayMs={60}>
          <h2 className={`${lora.className} mx-auto mb-4 mt-5 max-w-[680px] text-center text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.15]`}>
            No more monotonous lectures.
          </h2>
        </TuitionReveal>
        <TuitionReveal delayMs={120}>
          <p className="mx-auto mb-14 max-w-[600px] text-center text-lg leading-[1.5] text-muted">
            Master content and exam technique with a methodical approach. One-to-one learning enables every
            learner to reach their potential.
          </p>
        </TuitionReveal>
        <div className="grid grid-cols-2 gap-x-12 gap-y-10 max-md:grid-cols-1">
          {points.map((point, index) => (
            <TuitionReveal key={point.title} delayMs={index * 70}>
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-forge shadow-card transition duration-300 hover:-translate-y-0.5">
                  <point.icon className="size-5" />
                </span>
                <div>
                  <h3 className="m-0 text-base font-extrabold">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{point.copy}</p>
                </div>
              </div>
            </TuitionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
