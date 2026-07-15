import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis } from "@/components/tuition/tuition-kicker";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";

export function TuitionHero() {
  return (
    <section className="border-b border-line bg-white px-5 py-[clamp(72px,9vw,110px)] text-center">
      <h1
        className={`${lora.className} animate-hero-rise mx-auto max-w-[720px] text-[clamp(38px,5.5vw,58px)] font-bold leading-[1.15]`}
        style={{ animationDelay: "0ms" }}
      >
        Master National 5 and Higher with <TuitionEmphasis>expert precision</TuitionEmphasis>.
      </h1>
      <p
        className="animate-hero-rise mx-auto mt-6 max-w-[560px] text-lg leading-[1.5] text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Specialist one-to-one tuition in National 5 and Higher Maths and Physics.
      </p>
      <div className="animate-hero-rise mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "220ms" }}>
        <TuitionButtonLink href="#contact" size="lg">
          Book a session
        </TuitionButtonLink>
        <TuitionButtonLink href="#levels" variant="secondary" size="lg">
          Explore levels
        </TuitionButtonLink>
      </div>
    </section>
  );
}
