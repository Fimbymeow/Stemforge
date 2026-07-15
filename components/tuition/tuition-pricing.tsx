"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

const INCLUDED = [
  "1-to-1 online sessions",
  "Personalised lesson plans",
  "Built around the SQA specification",
  "Free trial session",
];

const FAQS = [
  {
    question: "Is there a free trial?",
    answer: "Yes — your first session is free, so you can see if it's the right fit before committing to more.",
  },
  {
    question: "Are sessions online or in person?",
    answer: "All sessions are conducted online.",
  },
  {
    question: "How do I book?",
    answer: "Send an enquiry through the contact form (or email directly) and you'll get a reply to arrange your first free session.",
  },
] as const;

export function TuitionPricing() {
  return (
    <>
      <section className="border-b border-line bg-white px-5 py-20 text-center">
        <div className="animate-hero-rise" style={{ animationDelay: "0ms" }}>
          <TuitionKicker>Pricing</TuitionKicker>
        </div>
        <h1
          className={`${lora.className} animate-hero-rise mx-auto mt-5 max-w-[560px] text-[clamp(30px,4vw,44px)] font-bold leading-[1.15]`}
          style={{ animationDelay: "100ms" }}
        >
          Transparent, <TuitionEmphasis>straightforward</TuitionEmphasis> pricing.
        </h1>
        <p className="animate-hero-rise mx-auto mt-5 max-w-[480px] text-lg leading-[1.5] text-muted" style={{ animationDelay: "200ms" }}>
          One rate per level, whichever subject you need. Every first session is free.
        </p>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%_-_40px))] py-20">
        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {tuitionLevels.map((level, index) => (
            <TuitionReveal key={level.slug} delayMs={index * 70} className="h-full">
              <article className="grid h-full content-between gap-6 rounded-[6px] border border-line bg-white p-6 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-card">
                <div>
                  <span className="grid size-11 place-items-center rounded-lg bg-forge-soft text-forge">
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
                  Book a free trial
                </TuitionButtonLink>
              </article>
            </TuitionReveal>
          ))}
        </div>
      </section>

      <section className="bg-forge-soft/40 px-5 py-20">
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
    <div className="rounded-[6px] border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left text-base font-extrabold text-ink"
      >
        {question}
        <ChevronDown className={`size-5 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" aria-hidden={!open}>
          <p className="m-0 px-5 pb-5 leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}
