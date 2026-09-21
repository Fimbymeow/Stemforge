import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { TUITION_CARD, TUITION_CONTAINER, TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

const points = [
  {
    title: "Focused one-to-one support",
    copy: "Sessions concentrate on the exact methods and question types causing difficulty, rather than following a fixed class pace.",
  },
  {
    title: "Clear explanations followed by practice",
    copy: "We first make the method understandable, then use guided and independent questions to ensure it can actually be applied.",
  },
  {
    title: "Current Scottish course focus",
    copy: "Lessons are built around National 5 and Higher course requirements and recurring exam-style skills.",
  },
  {
    title: "Original Orthic practice",
    copy: "Where useful, sessions can draw on original staged questions developed through Orthic, progressing from direct fluency to harder applications.",
  },
] as const;

export function TuitionDifference() {
  return (
    <section className={`border-y border-line bg-white ${TUITION_SECTION_SPACING}`}>
      <div className={TUITION_CONTAINER}>
        <TuitionReveal className="text-center">
          <TuitionKicker>The Orthic difference</TuitionKicker>
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
        <div className={`${TUITION_CARD} grid grid-cols-2 overflow-hidden max-md:grid-cols-1`}>
          {points.map((point, index) => (
            <TuitionReveal key={point.title} delayMs={index * 70}>
              <div className={`flex min-h-full gap-4 p-6 ${index < 2 ? "border-b border-line" : ""} ${index % 2 === 0 ? "border-r border-line max-md:border-r-0" : ""} max-md:border-b max-md:border-line max-md:last:border-b-0`}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forge-soft font-semibold text-forge">
                  {index + 1}
                </span>
                <div>
                  <h3 className="m-0 text-base font-semibold">{point.title}</h3>
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
