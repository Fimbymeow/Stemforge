import { Laptop, MessageCircleHeart, Target, UserRound } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

const differentiators = [
  {
    icon: MessageCircleHeart,
    title: "Patient & supportive",
    copy: "A calm, stress-free environment where questions are welcomed and mistakes are part of learning.",
  },
  {
    icon: Target,
    title: "Results-driven",
    copy: "Every session is structured with the exam in mind, focused on the marks that matter most.",
  },
  {
    icon: Laptop,
    title: "Online sessions",
    copy: "All tuition is delivered online, fitting around your schedule wherever you are.",
  },
] as const;

export function TuitionAbout() {
  return (
    <>
      <section className="border-b border-line bg-white px-5 py-20 text-center">
        <div className="animate-hero-rise" style={{ animationDelay: "0ms" }}>
          <TuitionKicker>About</TuitionKicker>
        </div>
        <h1
          className={`${lora.className} animate-hero-rise mx-auto mt-5 max-w-[640px] text-[clamp(30px,4vw,44px)] font-bold leading-[1.15]`}
          style={{ animationDelay: "100ms" }}
        >
          Meet <TuitionEmphasis>your tutor</TuitionEmphasis>.
        </h1>
        <p className="animate-hero-rise mx-auto mt-5 max-w-[560px] text-lg leading-[1.5] text-muted" style={{ animationDelay: "200ms" }}>
          Built to make National 5 and Higher Maths and Physics genuinely make sense — not just pass the exam.
        </p>
      </section>

      <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-20">
        <TuitionReveal>
          <TuitionKicker>My philosophy</TuitionKicker>
          <p className="mt-5 text-lg leading-[1.6] text-ink">
            Maths and Physics aren&apos;t a collection of rules to memorise — they&apos;re a way of thinking that clicks
            once you understand why a method works, not just how to apply it.
          </p>
          <p className="mt-4 text-lg leading-[1.6] text-ink">
            Sessions focus on building that understanding from solid foundations, then applying it under exam
            conditions — the same structured, worked-solution approach behind STEM Forge itself.
          </p>
        </TuitionReveal>

        <TuitionReveal delayMs={80} className="mt-14">
          <div className="text-center">
            <TuitionKicker>Meet the tutor</TuitionKicker>
          </div>
          <div className="mt-5 grid grid-cols-[auto_1fr] gap-5 rounded-xl border border-line bg-white p-7 max-sm:grid-cols-1 max-sm:text-center">
            <span className="mx-auto grid size-16 shrink-0 place-items-center rounded-full bg-forge-soft text-forge max-sm:mx-auto">
              <UserRound className="size-8" />
            </span>
            <div>
              <h2 className={`${lora.className} m-0 text-xl font-bold`}>[Your name]</h2>
              <p className="mt-1 text-sm font-bold text-muted">[Qualifications / background — e.g. degree, school, relevant experience]</p>
              <p className="mt-1 text-sm font-bold text-warning">[X years] tutoring experience</p>
              <p className="mt-3 leading-relaxed text-muted">
                [Add a short bio here — your background, why you tutor, and what students can expect from working
                with you.]
              </p>
            </div>
          </div>
        </TuitionReveal>
      </section>

      <section className="bg-forge-soft/40 px-5 py-20">
        <div className="mx-auto grid w-[min(900px,100%)] grid-cols-3 gap-x-10 gap-y-8 max-md:grid-cols-1">
          {differentiators.map((item, index) => (
            <TuitionReveal key={item.title} delayMs={index * 70}>
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-forge shadow-card transition duration-300 hover:-translate-y-0.5">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <h3 className="m-0 text-base font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.copy}</p>
                </div>
              </div>
            </TuitionReveal>
          ))}
        </div>
      </section>

      <TuitionReveal className="block px-5 py-16 text-center">
        <p className={`${lora.className} m-0 text-2xl font-bold`}>Ready to get started?</p>
        <div className="mt-6">
          <TuitionButtonLink href="/tuition#contact" size="lg">
            Book a session
          </TuitionButtonLink>
        </div>
      </TuitionReveal>
    </>
  );
}
