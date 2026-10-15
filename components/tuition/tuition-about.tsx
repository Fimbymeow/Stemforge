import { Check } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { TuitionTutorCard } from "@/components/tuition/tuition-tutor-card";
import { TUITION_CARD, TUITION_CONTAINER, TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

const qualifications = [
  "A in Higher Mathematics",
  "A in Higher Physics",
  "A in Higher Chemistry",
  "A in Higher Biology",
  "A in Higher English",
] as const;

const currentStudy = [
  "Advanced Higher Mathematics",
  "Advanced Higher Physics",
  "Advanced Higher Chemistry",
  "Advanced Higher Mathematics of Mechanics",
] as const;

const lessonSteps = [
  { title: "Review", copy: "Look over homework and anything that caused difficulty." },
  { title: "Diagnose", copy: "Identify the exact gaps or misconceptions holding the topic back." },
  { title: "Explain", copy: "Break down the method clearly and connect it to what the student already knows." },
  { title: "Work together", copy: "Solve examples collaboratively until the method is secure." },
  { title: "Independent practice", copy: "The student attempts questions independently while I check method and reasoning." },
  { title: "Next steps", copy: "Agree focused homework and what we will tackle next." },
] as const;

const credibility = [
  {
    title: "2+ years tutoring",
    copy: "One-to-one experience supporting pupils with National 5 and Higher work.",
  },
  {
    title: "Maths and Physics",
    copy: "Tuition for National 5 and Higher Maths and Physics, delivered online.",
  },
  {
    title: "Current Scottish courses",
    copy: "Recent first-hand course experience, five Higher A grades and current Advanced Higher study.",
  },
] as const;

export function TuitionAbout() {
  return (
    <>
      <section className="border-b border-line px-5 py-[clamp(64px,8vw,88px)] text-center">
        <div>
          <TuitionKicker>About</TuitionKicker>
        </div>
        <h1
          className={`${lora.className} mx-auto mt-5 max-w-[640px] text-[clamp(36px,5vw,52px)] font-bold leading-[1.12]`}
        >
          Meet <TuitionEmphasis>Finlay</TuitionEmphasis>.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-lg leading-[1.55] text-muted">
          17, based in Scotland, tutoring National 5 and Higher Maths and Physics.
        </p>
      </section>

      <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-[clamp(64px,8vw,88px)]">
        <TuitionReveal>
          <div className="text-center">
            <TuitionKicker>Meet the tutor</TuitionKicker>
          </div>
          <div className="mt-5">
            <TuitionTutorCard>
              <p className="m-0">
                I have 2+ years of tutoring experience and achieved A grades across Higher Maths, Physics, Chemistry,
                Biology and English. I&apos;m currently studying Advanced Higher Mathematics, Physics, Chemistry and
                Mathematics of Mechanics. That recent experience of Scottish courses shapes sessions built around
                clear explanation, worked examples, guided practice and independent attempts. I&apos;m also building
                Orthic, a structured Scottish STEM learning platform with original practice questions.
              </p>
            </TuitionTutorCard>
          </div>
        </TuitionReveal>

        <TuitionReveal delayMs={80} className="mt-10">
          <TuitionKicker>Why a recent student?</TuitionKicker>
          <p className="mt-5 text-lg leading-[1.6] text-ink">
            I&apos;m 17 and have 2+ years of tutoring experience. That combines recent first-hand knowledge of Scottish
            courses and exam pressure with an established, structured approach to preparation and teaching.
          </p>
        </TuitionReveal>

        <TuitionReveal delayMs={140} className="mt-14">
          <div className="text-center">
            <TuitionKicker>What a lesson looks like</TuitionKicker>
          </div>
          <ol className="mx-auto mt-6 max-w-[620px] list-none border-y border-line p-0">
            {lessonSteps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[44px_1fr] gap-4 border-b border-line py-4 last:border-b-0">
                <span className="pt-0.5 font-mono text-xs font-semibold tracking-[0.12em] text-forge">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="m-0 text-base font-extrabold text-ink">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </TuitionReveal>
      </section>

      <section className="border-y border-line bg-white px-5 py-16">
        <div className={`${TUITION_CARD} mx-auto w-[min(660px,100%)] p-7 text-center`}>
          <TuitionKicker>Qualifications</TuitionKicker>
          <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-2">
            {qualifications.map((item) => (
              <p key={item} className="m-0 flex items-start gap-2 text-sm font-semibold text-ink">
                <Check className="mt-0.5 size-4 shrink-0 text-forge" />
                {item}
              </p>
            ))}
          </div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-wide text-muted">Currently studying</p>
          <div className="mt-3 grid gap-2.5 text-left">
            {currentStudy.map((item) => (
              <p key={item} className="m-0 flex items-start gap-2 text-sm font-semibold text-ink">
                <Check className="mt-0.5 size-4 shrink-0 text-forge" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-5 ${TUITION_SECTION_SPACING}`}>
        <div className={`${TUITION_CONTAINER} grid grid-cols-3 border-y border-line max-md:grid-cols-1`}>
          {credibility.map((item, index) => (
            <TuitionReveal key={item.title} delayMs={index * 70}>
              <div className={`h-full py-7 ${index > 0 ? "border-l border-line pl-7 max-md:border-l-0 max-md:border-t max-md:pl-0" : "pr-7 max-md:pr-0"} ${index === 1 ? "pr-7" : ""}`}>
                  <h3 className="m-0 text-base font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.copy}</p>
              </div>
            </TuitionReveal>
          ))}
        </div>
      </section>

      <TuitionReveal className="block px-5 py-16 text-center">
        <p className={`${lora.className} m-0 text-2xl font-bold`}>Ready to get started?</p>
        <div className="mt-6">
          <TuitionButtonLink href="/tuition#contact" size="lg">
            Enquire about a free first session
          </TuitionButtonLink>
        </div>
      </TuitionReveal>
    </>
  );
}
