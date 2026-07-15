"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { getTuitionLevelBySlug, tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";

export function TuitionSubjects() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("level");
  const initialSlug = (requested && getTuitionLevelBySlug(requested)?.slug) || tuitionLevels[0].slug;
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const selected = getTuitionLevelBySlug(selectedSlug) ?? tuitionLevels[0];

  return (
    <section className="mx-auto w-[min(1040px,calc(100%_-_40px))] py-20">
      <div className="animate-hero-rise text-center" style={{ animationDelay: "0ms" }}>
        <TuitionKicker>Subjects</TuitionKicker>
      </div>
      <h1
        className={`${lora.className} animate-hero-rise mx-auto mb-4 mt-5 max-w-[640px] text-center text-[clamp(30px,4vw,44px)] font-bold leading-[1.15]`}
        style={{ animationDelay: "100ms" }}
      >
        Structured tutoring, tailored to the <TuitionEmphasis>SQA curriculum</TuitionEmphasis>.
      </h1>
      <p className="animate-hero-rise mx-auto mb-11 max-w-[560px] text-center text-lg leading-[1.5] text-muted" style={{ animationDelay: "180ms" }}>
        Comprehensive, methodical tutoring built around National 5 and Higher Maths and Physics.
      </p>

      <div
        className="animate-hero-rise mb-8 flex flex-wrap justify-center gap-2"
        style={{ animationDelay: "260ms" }}
        role="tablist"
        aria-label="Tuition levels"
      >
        {tuitionLevels.map((level) => (
          <button
            key={level.slug}
            type="button"
            role="tab"
            aria-selected={level.slug === selectedSlug}
            onClick={() => setSelectedSlug(level.slug)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-extrabold transition duration-300 ${
              level.slug === selectedSlug
                ? "border-forge bg-forge-soft text-forge"
                : "border-line bg-white text-muted hover:border-forge/40"
            }`}
          >
            <level.icon className="size-4" />
            {level.name}
          </button>
        ))}
      </div>

      <div key={selectedSlug} className="animate-tuition-reveal rounded-xl border border-line bg-white p-8 max-sm:p-6">
        <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-wide text-warning">
          SQA {selected.level} · {selected.subject}
        </p>
        <h2 className={`${lora.className} m-0 text-2xl font-bold`}>{selected.name}</h2>
        <p className="mt-3 max-w-[640px] leading-relaxed text-muted">{selected.copy}</p>

        <p className="mt-7 mb-3 text-sm font-extrabold uppercase text-ink">Core syllabus</p>
        <ul className="m-0 grid gap-2.5 p-0">
          {selected.topics.map((topic) => (
            <li key={topic} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-forge" />
              {topic}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="m-0 text-sm font-bold text-muted">
            From <span className="text-ink">£{selected.pricePerHour}/hour</span> · Free trial session available
          </p>
          <TuitionButtonLink href="/tuition#contact">Enquire availability</TuitionButtonLink>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Not sure which level? <Link href="/tuition#contact" className="font-extrabold text-warning">Get in touch</Link> and we&apos;ll help you choose.
      </p>
    </section>
  );
}
