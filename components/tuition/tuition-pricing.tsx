"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { TUITION_CARD, TUITION_CONTAINER, TUITION_ICON, TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

const INCLUDED = [
  "1-to-1 online sessions",
  "Personalised lesson plans",
  "Built around the Qualifications Scotland specification",
  "Free trial session",
];

const FAQS = [
  {
    question: "Who teaches the lessons?",
    answer:
      "Finlay Kennedy — achieved A grades across all five Highers (Maths, Physics, Chemistry, Biology and English) and is currently studying Advanced Higher Maths, Physics and Chemistry.",
  },
  {
    question: "Why choose a recent student tutor?",
    answer:
      "The material and exam pressure are still fresh, having just been through the same courses. That recency is combined with structured, one-to-one preparation — not a comparison against what a qualified teacher offers.",
  },
  {
    question: "Which subjects and levels are available?",
    answer: "National 5 and Higher Maths, and National 5 and Higher Physics.",
  },
  {
    question: "What happens in the free first session?",
    answer:
      "Your first session is free with no obligation — it's a chance to talk through your goals and see if it's the right fit before booking any further sessions.",
  },
  {
    question: "Are sessions online or in person?",
    answer: "All sessions are conducted online.",
  },
  {
    question: "What happens after I enquire?",
    answer: "Online enquiries are temporarily unavailable while a verified Orthic contact route is prepared.",
  },
] as const;

export function TuitionPricing() {
  return (
    <>
      <section className="border-b border-line px-5 py-[clamp(64px,8vw,88px)] text-center">
        <div>
          <TuitionKicker>Pricing</TuitionKicker>
        </div>
        <h1
          className={`${lora.className} mx-auto mt-5 max-w-[680px] text-[clamp(36px,5vw,52px)] font-bold leading-[1.12]`}
        >
          Transparent, <TuitionEmphasis>straightforward</TuitionEmphasis> pricing.
        </h1>
        <p className="mx-auto mt-5 max-w-[520px] text-lg leading-[1.55] text-muted">
          One rate per level, whichever subject you need. Every first session is free.
        </p>
      </section>

      <section className={`${TUITION_CONTAINER} ${TUITION_SECTION_SPACING}`}>
        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {tuitionLevels.map((level, index) => (
            <TuitionReveal key={level.slug} delayMs={index * 70} className="h-full">
              <article className={`${TUITION_CARD} grid h-full content-between gap-6 p-6`}>
                <div>
                  <span className={TUITION_ICON}>
                    <level.icon className="size-5" />
                  </span>
                  <h2 className={`${lora.className} mt-4 text-lg font-bold leading-tight`}>{level.name}</h2>
                  <p className="mt-2 text-3xl font-extrabold">
                    £{level.pricePerHour}
                    <span className="text-base font-bold text-muted"> /hour</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{level.copy}</p>
                  <ul className="mt-5 grid gap-2 p-0">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-ink">
                        <Check className="mt-0.5 size-4 shrink-0 text-forge" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <TuitionButtonLink href="/tuition#contact" className="w-full">
                  Enquire about a free trial
                </TuitionButtonLink>
              </article>
            </TuitionReveal>
          ))}
        </div>
      </section>

      <section className={`border-t border-line bg-white px-5 ${TUITION_SECTION_SPACING}`}>
        <div className="mx-auto w-[min(720px,100%)]">
          <TuitionReveal className="text-center">
            <TuitionKicker>FAQ</TuitionKicker>
          </TuitionReveal>
          <TuitionReveal delayMs={60}>
            <h2 className={`${lora.className} mb-9 mt-5 text-center text-2xl font-bold`}>Frequently asked questions</h2>
          </TuitionReveal>
          <div className="grid gap-3">
            {FAQS.map((faq, index) => (
              <TuitionReveal key={faq.question} delayMs={120 + index * 60}>
                <FaqItem question={faq.question} answer={faq.answer} />
              </TuitionReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="tuition-interactive flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left text-base font-semibold text-ink hover:bg-forge-soft/20"
      >
        {question}
        <ChevronDown className={`tuition-disclosure-chevron size-5 shrink-0 text-muted ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"}`}>
        <div className="overflow-hidden" aria-hidden={!open}>
          <p className="m-0 px-5 pb-5 leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}
