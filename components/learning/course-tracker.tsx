"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Subject } from "@/data/types";
import { deriveHigherMathsCourseTracker } from "@/lib/course-tracker";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";

export function CourseTracker({ subject }: { subject: Subject }) {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const model = useMemo(() => deriveHigherMathsCourseTracker(subject, evidence), [subject, evidence]);

  return (
    <div className="grid gap-8" data-testid="course-tracker">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <h2 className="text-xl font-extrabold">Skills by course area</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">See what you can learn now, what is planned, and the official requirements behind each skill.</p>
        </div>
        <p className="text-sm font-extrabold text-forge" data-testid="course-tracker-coverage">{model.availableSkillCount} of {model.totalSkillCount} Higher Maths skills available</p>
      </div>

      {model.areas.map((area) => (
        <section key={area.courseAreaId} aria-labelledby={`tracker-area-${area.courseAreaId}`} className="grid gap-6 border-t-2 border-ink pt-5 first:border-t-0 first:pt-0">
          <h3 id={`tracker-area-${area.courseAreaId}`} className="text-xl font-extrabold">{area.title}</h3>
          <div className="grid gap-7">
            {area.requirements.map((requirement) => (
              <section key={requirement.areaId} aria-labelledby={`tracker-topic-${requirement.areaId}`} className="min-w-0">
                <h4 id={`tracker-topic-${requirement.areaId}`} className="text-base font-extrabold text-ink">{requirement.title}</h4>
                <ul className="mt-3 divide-y divide-line border-y border-line" aria-label={`${requirement.title} Orthic skills`}>
                  {requirement.skills.map((skill) => <TrackerSkillRow key={skill.skillPathId} skill={skill} />)}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="tracker-reasoning-title" className="border-t border-line pt-6">
        <h3 id="tracker-reasoning-title" className="text-lg font-extrabold">Reasoning across the course</h3>
        <p className="mt-1 text-sm text-muted">These requirements are developed through contextual skills rather than represented as extra standalone learning paths.</p>
        <div className="mt-3 grid gap-2">
          {model.courseWideRequirements.map((requirement) => (
            <details key={requirement.areaId} className="border-b border-line">
              <summary className="min-h-11 cursor-pointer py-3 font-bold">{requirement.title}</summary>
              <div className="border-l-2 border-line pb-4 pl-3 text-sm leading-relaxed text-muted">
                {requirement.officialPoints.map((point) => <p key={point.id} data-testid="course-tracker-official-point" data-official-point-id={point.id}><span className="font-bold text-ink">{point.reference}:</span> {point.text}</p>)}
                <p className="mt-2"><span className="font-bold text-ink">Mapped through:</span> {requirement.mappedSkillNames.join(", ")}.</p>
              </div>
            </details>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Source: Higher Mathematics course specification, May 2023 (version 3.0), Scottish Qualifications Authority. Confirmed current by Qualifications Scotland.</p>
      </section>
    </div>
  );
}

function TrackerSkillRow({ skill }: { skill: ReturnType<typeof deriveHigherMathsCourseTracker>["areas"][number]["requirements"][number]["skills"][number] }) {
  const isComingSoon = skill.availability === "Coming soon";
  return (
    <li
      className={`min-w-0 px-1 ${isComingSoon ? "py-3" : "border-l-2 border-forge bg-white py-4 pl-3 pr-2 sm:pl-4 sm:pr-3"}`}
      data-testid={`tracker-skill-${skill.skillPathId}`}
      data-course-tracker-skill=""
    >
      <div className={`grid min-w-0 gap-3 ${skill.action ? "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" : ""}`}>
        <div className="min-w-0">
          {isComingSoon ? (
            <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h5 className="break-words font-bold text-muted">{skill.name}</h5>
              <span className="text-xs font-bold text-muted">Coming soon</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-forge">Available now</p>
              <h5 className="mt-0.5 break-words text-lg font-extrabold text-ink">{skill.name}</h5>
            </>
          )}
          {!isComingSoon ? (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              {skill.structuralStatus ? <span><span className="font-bold text-ink">Progress:</span> {skill.structuralStatus}</span> : null}
              {skill.knowledgeStatus ? <span><span className="font-bold text-ink">Knowledge:</span> {skill.knowledgeStatus}</span> : null}
              {skill.reviewDue ? <span className="font-bold text-warning">Review due</span> : null}
            </div>
          ) : null}
          {skill.knowledgeReason ? <p className="mt-1 text-sm text-muted">{skill.knowledgeReason}</p> : null}

          <details className="mt-2 text-sm text-muted" data-testid={`tracker-requirements-${skill.skillPathId}`}>
            <summary
              aria-label={`View official requirements for ${skill.name}`}
              className={`min-h-10 cursor-pointer py-2 text-sm font-semibold underline-offset-4 hover:underline ${isComingSoon ? "text-muted" : "text-ink"}`}
            >
              View official requirements ({skill.officialPoints.length})
            </summary>
            <ul className="grid gap-2 border-l-2 border-line pb-2 pl-3 leading-relaxed">
              {skill.officialPoints.map((point) => (
                <li key={point.id} data-testid="course-tracker-official-point" data-official-point-id={point.id}>
                  <span className="font-bold text-ink">{point.reference}:</span> {point.text}
                </li>
              ))}
            </ul>
          </details>
        </div>
        {skill.action ? (
          <Link href={skill.action.href} className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-forge px-3 text-center text-sm font-extrabold text-forge sm:w-auto sm:max-w-44">
            {skill.action.label}<ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        ) : null}
      </div>
    </li>
  );
}
