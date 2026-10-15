import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis } from "@/components/tuition/tuition-kicker";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";

export function TuitionHero() {
  return (
    <section className="border-b border-line px-5 py-[clamp(72px,9vw,104px)] text-center">
      <TuitionKicker>One-to-one academic tuition</TuitionKicker>
      <h1
        className={`${lora.className} mx-auto mt-5 max-w-[760px] text-[clamp(38px,5.5vw,56px)] font-bold leading-[1.12]`}
      >
        Clear, <TuitionEmphasis>structured</TuitionEmphasis> Maths and Physics tuition for National 5 and Higher.
      </h1>
      <p className="mx-auto mt-6 max-w-[590px] text-lg leading-[1.55] text-muted">
        One-to-one support from Finlay Kennedy, with 2+ years of tutoring experience and A grades across five
        Highers.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <TuitionButtonLink href="#contact" size="lg">
          Enquire about a free first session
        </TuitionButtonLink>
        <TuitionButtonLink href="#levels" variant="secondary" size="lg">
          Explore levels
        </TuitionButtonLink>
      </div>
      <p className="mx-auto mt-7 max-w-[720px] text-sm leading-relaxed text-muted">
        Currently studying Advanced Higher Mathematics, Physics, Chemistry and Mathematics of Mechanics · First
        session free
      </p>
    </section>
  );
}
