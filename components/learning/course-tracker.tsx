"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Subject } from "@/data/types";
import { Card } from "@/components/ui";
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
    <div className="grid gap-5" data-testid="course-tracker">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Course tracker</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Official requirements are grouped separately from STEM Forge&apos;s teachable skills.</p>
        </div>
        <p className="text-sm font-extrabold text-forge" data-testid="course-tracker-coverage">{model.availableSkillCount} of {model.totalSkillCount} Higher Maths skills available</p>
      </div>

      {model.areas.map((area) => (
        <section key={area.courseAreaId} aria-labelledby={`tracker-area-${area.courseAreaId}`} className="grid gap-3">
          <h3 id={`tracker-area-${area.courseAreaId}`} className="text-lg font-extrabold">{area.title}</h3>
          {area.requirements.map((requirement) => (
            <Card key={requirement.areaId} className="overflow-hidden p-0">
              <div className="border-b border-line bg-paper px-4 py-3 sm:px-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Official specification</p>
                <h4 className="mt-1 font-extrabold">{requirement.title}</h4>
                <details className="mt-2 text-sm text-muted">
                  <summary className="min-h-10 cursor-pointer py-2 font-bold text-ink">Read official requirements ({requirement.officialPoints.length})</summary>
                  <ul className="grid gap-2 border-t border-line pt-3">
                    {requirement.officialPoints.map((point) => <li key={point.id} data-testid="course-tracker-official-point"><span className="font-bold text-ink">{point.reference}:</span> {point.text}</li>)}
                  </ul>
                </details>
              </div>
              <div>
                <p className="px-4 pt-3 text-xs font-extrabold uppercase tracking-wide text-muted sm:px-5">STEM Forge skills</p>
                <ul className="divide-y divide-line" aria-label={`${requirement.title} STEM Forge skills`}>
                  {requirement.skills.map((skill) => <TrackerSkillRow key={skill.skillPathId} skill={skill} />)}
                </ul>
              </div>
            </Card>
          ))}
        </section>
      ))}

      <Card className="p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Official specification</p>
        <h3 className="mt-1 text-lg font-extrabold">Reasoning across the course</h3>
        <p className="mt-1 text-sm text-muted">These requirements are developed through contextual skills rather than represented as extra standalone learning paths.</p>
        <div className="mt-3 grid gap-2">
          {model.courseWideRequirements.map((requirement) => (
            <details key={requirement.areaId} className="rounded-lg border border-line px-3">
              <summary className="min-h-11 cursor-pointer py-3 font-bold">{requirement.title}</summary>
              <div className="border-t border-line py-3 text-sm text-muted">
                {requirement.officialPoints.map((point) => <p key={point.id} data-testid="course-tracker-official-point">{point.text}</p>)}
                <p className="mt-2"><span className="font-bold text-ink">Mapped through:</span> {requirement.mappedSkillNames.join(", ")}.</p>
              </div>
            </details>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Source: Higher Mathematics course specification, May 2023 (version 3.0), Scottish Qualifications Authority. Confirmed current by Qualifications Scotland.</p>
      </Card>
    </div>
  );
}

function TrackerSkillRow({ skill }: { skill: ReturnType<typeof deriveHigherMathsCourseTracker>["areas"][number]["requirements"][number]["skills"][number] }) {
  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5 ${skill.availability === "Coming soon" ? "bg-paper/60" : ""}`} data-testid={`tracker-skill-${skill.skillPathId}`}>
      <div className="min-w-0">
        <p className={`break-words font-extrabold ${skill.availability === "Coming soon" ? "text-muted" : "text-ink"}`}>{skill.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-muted">
          <span>{skill.availability}</span>
          {skill.structuralStatus ? <span>Progress: {skill.structuralStatus}</span> : null}
          {skill.knowledgeStatus ? <span>Knowledge: {skill.knowledgeStatus}</span> : null}
          {skill.reviewDue ? <span className="text-warning">Review due</span> : null}
        </div>
        {skill.knowledgeReason ? <p className="mt-1 text-xs text-muted">{skill.knowledgeReason}</p> : null}
      </div>
      {skill.action ? (
        <Link href={skill.action.href} className="inline-flex min-h-11 max-w-40 items-center justify-center gap-1 rounded-lg border border-forge px-3 text-center text-sm font-extrabold text-forge">
          {skill.action.label}<ArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </Link>
      ) : <span className="text-sm font-bold text-muted">Coming soon</span>}
    </li>
  );
}
