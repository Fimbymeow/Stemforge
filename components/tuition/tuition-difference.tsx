import { BookOpen, Compass, Target, TrendingUp } from "lucide-react";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

const points = [
  {
    icon: Target,
    title: "Focused one-to-one support",
    copy: "Sessions concentrate on the exact methods and question types causing difficulty, rather than following a fixed class pace.",
  },
  {
    icon: BookOpen,
    title: "Clear explanations followed by practice",
    copy: "We first make the method understandable, then use guided and independent questions to ensure it can actually be applied.",
  },
  {
    icon: Compass,
    title: "Current Scottish course focus",
    copy: "Lessons are built around National 5 and Higher course requirements and recurring exam-style skills.",
  },
  {
    icon: TrendingUp,
    title: "Original STEM Forge practice",
    copy: "Where useful, sessions can draw on original staged questions developed through STEM Forge, progressing from direct fluency to harder applications.",
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
            How each lesson is structured.
          </h2>
        </TuitionReveal>
        <TuitionReveal delayMs={120}>
          <p className="mx-auto mb-14 max-w-[600px] text-center text-lg leading-[1.5] text-muted">
            One-to-one time is used to work directly on the methods and questions causing difficulty, with clear
            explanations and exam-style practice throughout.
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
