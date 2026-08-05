import { Check, Laptop, MessageCircleHeart, Target } from "lucide-react";
import { TuitionAvatarPlaceholder } from "@/components/tuition/tuition-avatar";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

const qualifications = [
  "A in Higher Mathematics",
  "A in Higher Physics",
  "A in Higher Chemistry",
  "A in Higher Biology",
  "A in Higher English",
] as const;

const currentStudy = ["Advanced Higher Mathematics", "Advanced Higher Physics", "Advanced Higher Chemistry"] as const;

const lessonSteps = [
  { title: "Identify the gap", copy: "We start by pinning down exactly what's causing difficulty, not just the topic in general." },
  { title: "Explain the method", copy: "A clear walkthrough of the method itself, in plain language, before any question is attempted." },
  { title: "Work through it together", copy: "A worked example done together, so the method is applied while it's still fresh." },
  { title: "Attempt it independently", copy: "Similar questions attempted alone, with support close by if needed." },
  { title: "Leave with a next step", copy: "Every session ends with a clear, specific thing to practise or revisit before the next one." },
] as const;

const differentiators = [
  {
    icon: MessageCircleHeart,
    title: "Patient & supportive",
    copy: "A calm, stress-free environment where questions are welcomed and mistakes are treated as part of learning.",
  },
  {
    icon: Target,
    title: "Focused on exam technique",
    copy: "Every session is structured with the exam in mind, working on the methods and question types that come up most.",
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
          Meet <TuitionEmphasis>Finlay</TuitionEmphasis>.
        </h1>
        <p className="animate-hero-rise mx-auto mt-5 max-w-[560px] text-lg leading-[1.5] text-muted" style={{ animationDelay: "200ms" }}>
          17, based in Scotland, tutoring National 5 and Higher Maths and Physics.
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
            <div className="mx-auto max-sm:mx-auto">
              <TuitionAvatarPlaceholder size="lg" />
            </div>
            <div>
              <h2 className={`${lora.className} m-0 text-xl font-bold`}>Finlay Kennedy</h2>
              <p className="mt-1 text-sm font-bold text-muted">17 · National 5 and Higher Maths &amp; Physics tutor</p>
              <p className="mt-3 leading-relaxed text-muted">
                I recently sat the same National 5 and Higher courses my students are working through now, so the
                material and exam pressure are both still fresh. Sessions are structured around a clear explanation,
                a worked example, and then guided and independent practice, so a method is genuinely understood
                before it&apos;s relied on in an exam. I&apos;m also building STEM Forge, a structured Scottish STEM
                learning platform with original practice questions — the same systematic approach carries over into
                every lesson. This tutoring service is new, so it&apos;s built around the same standards STEM Forge
                is held to, not a long track record.
              </p>
            </div>
          </div>
        </TuitionReveal>

        <TuitionReveal delayMs={140} className="mt-10">
          <TuitionKicker>Why a recent student?</TuitionKicker>
          <p className="mt-5 text-lg leading-[1.6] text-ink">
            I&apos;m 17, which means I have recent first-hand experience of the exact courses and exam pressures my
            students are facing. I combine that recency with structured preparation and clear, patient teaching.
          </p>
        </TuitionReveal>

        <TuitionReveal delayMs={180} className="mt-14">
          <div className="text-center">
            <TuitionKicker>What a lesson looks like</TuitionKicker>
          </div>
          <ol className="mx-auto mt-6 grid max-w-[560px] list-none gap-5 p-0">
            {lessonSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forge-soft text-sm font-extrabold text-forge">
                  {index + 1}
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

      <section className="border-t border-line bg-white px-5 py-16">
        <div className="mx-auto w-[min(560px,100%)] text-center">
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
            Enquire about a free first session
          </TuitionButtonLink>
        </div>
      </TuitionReveal>
    </>
  );
}
