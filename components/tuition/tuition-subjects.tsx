"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";
import { getTuitionLevelBySlug, tuitionLevels } from "@/components/tuition/tuition-data";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionEmphasis, TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TUITION_CARD, TUITION_CONTAINER, TUITION_SECTION_SPACING } from "@/components/tuition/tuition-styles";

export function TuitionSubjects() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("level");
  const initialSlug = (requested && getTuitionLevelBySlug(requested)?.slug) || tuitionLevels[0].slug;
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const selected = getTuitionLevelBySlug(selectedSlug) ?? tuitionLevels[0];

  return (
    <section className={`${TUITION_CONTAINER} ${TUITION_SECTION_SPACING}`}>
      <div className="text-center">
        <TuitionKicker>Subjects</TuitionKicker>
      </div>
      <h1
        className={`${lora.className} mx-auto mb-4 mt-5 max-w-[760px] text-center text-[clamp(36px,5vw,52px)] font-bold leading-[1.12]`}
      >
        Structured tutoring, tailored to the <TuitionEmphasis>Qualifications Scotland curriculum</TuitionEmphasis>.
      </h1>
      <p className="mx-auto mb-11 max-w-[620px] text-center text-lg leading-[1.55] text-muted">
        Comprehensive, methodical tutoring built around National 5 and Higher Maths and Physics.
      </p>

      <div
        className="mb-8 flex flex-wrap justify-center gap-2"
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
            className={`tuition-tab inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold ${
              level.slug === selectedSlug
                ? "border-forge bg-forge text-white"
                : "border-line bg-white text-muted hover:border-forge/40"
            }`}
          >
            <level.icon className="size-4" />
            {level.name}
          </button>
        ))}
      </div>

      <div key={selectedSlug} className={`${TUITION_CARD} tuition-content-change p-8 max-sm:p-6`}>
        <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-wide text-warning">
          Qualifications Scotland {selected.level} · {selected.subject}
        </p>
        <h2 className={`${lora.className} m-0 text-2xl font-bold`}>{selected.name}</h2>
        <p className="mt-3 max-w-[640px] leading-relaxed text-muted">{selected.copy}</p>

        <p className="mb-3 mt-7 text-xs font-bold uppercase tracking-[0.1em] text-ink">Core syllabus</p>
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
