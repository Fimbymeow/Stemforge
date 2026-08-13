"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Subject } from "@/data/types";
import { deriveHigherMathsCourseTracker } from "@/lib/course-tracker";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { IconNodePath } from "@/components/learning/icon-node-path";
import { MasteryMark } from "@/components/learning/mastery-badge";
import { getReviewPresentationState, ReviewStatus } from "@/components/learning/review-status";

export function CourseTracker({ subject }: { subject: Subject }) {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const [selectedArea, setSelectedArea] = useState(() => {
    const index = subject.courseAreas.findIndex((courseArea) => courseArea.specAreas.some((specArea) => specArea.skillPaths?.some((path) => path.isAvailable)));
    return index >= 0 ? index : 0;
  });
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
  const area = model.areas[selectedArea] ?? model.areas[0];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5" data-testid="course-tracker">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-lg font-extrabold">Skills by course area</h2>
          <p className="mt-1 text-sm text-muted">Select an area, scan its skills and expand official detail only when needed.</p>
        </div>
        <p className="text-sm font-bold text-forge" data-testid="course-tracker-coverage">{model.availableSkillCount} of {model.totalSkillCount} skills available</p>
      </div>

      <nav aria-label="Course areas" data-testid="course-tracker-unit-navigation">
        <IconNodePath
          items={model.areas.map((item) => ({ id: item.courseAreaId, label: item.title, available: item.requirements.some((requirement) => requirement.skills.some((skill) => skill.availability === "Available")) }))}
          selectedIndex={selectedArea}
          onSelect={setSelectedArea}
        />
      </nav>

      {area ? (
        <section aria-labelledby={`tracker-area-${area.courseAreaId}`} className="min-w-0" data-testid={`tracker-area-${area.courseAreaId}`}>
          <h3 id={`tracker-area-${area.courseAreaId}`} className="border-b-2 border-ink pb-3 text-xl font-extrabold">{area.title}</h3>
          <div className="divide-y divide-line">
            {area.requirements.map((requirement) => (
              <section key={requirement.areaId} aria-labelledby={`tracker-topic-${requirement.areaId}`} className="py-4">
                <h4 id={`tracker-topic-${requirement.areaId}`} className="text-sm font-extrabold text-ink">{requirement.title}</h4>
                <ul className="mt-2 divide-y divide-line border-y border-line" aria-label={`${requirement.title} Orthic skills`}>
                  {requirement.skills.map((skill) => <TrackerSkillRow key={skill.skillPathId} skill={skill} />)}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <details className="border-t border-line pt-3" data-testid="course-wide-requirements">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-extrabold">Reasoning across the course</summary>
        <p className="mb-3 text-sm text-muted">These requirements develop through contextual skills rather than separate learning paths.</p>
        <div className="grid gap-2">
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
      </details>
      <p className="text-xs text-muted">Source: Higher Mathematics course specification, May 2023 (version 3.0), Scottish Qualifications Authority. Confirmed current by Qualifications Scotland.</p>
    </div>
  );
}

function TrackerSkillRow({ skill }: { skill: ReturnType<typeof deriveHigherMathsCourseTracker>["areas"][number]["requirements"][number]["skills"][number] }) {
  const isComingSoon = skill.availability === "Coming soon";
  const reviewState = getReviewPresentationState({ eligible: skill.reviewEligible, due: skill.reviewDue, dueSoon: skill.reviewDueSoon });
  return (
    <li className={`min-w-0 ${isComingSoon ? "py-2" : "py-3"}`} data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-skill="">
      {isComingSoon ? (
        <div className="flex min-h-11 min-w-0 items-center gap-3">
          <h5 className="min-w-0 flex-1 break-words text-sm font-extrabold text-muted">{skill.name}</h5>
          <span className="text-xs font-bold text-muted">Coming soon</span>
        </div>
      ) : skill.action ? (
        <Link href={skill.action.href} aria-label={`Open ${skill.name} skill overview`} className="flex min-h-11 min-w-0 items-center gap-3 rounded-sm transition hover:bg-forge-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-forge">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h5 className="break-words text-sm font-extrabold text-ink">{skill.name}</h5>
              {skill.masteryStatus ? <MasteryMark status={skill.masteryStatus} density="labelled" /> : null}
              {(skill.reviewEligible || skill.reviewDue || skill.reviewDueSoon) ? <ReviewStatus state={reviewState} compact /> : null}
              {skill.knowledgeStatus === "Needs practice" ? <span className="text-xs font-bold text-muted">Needs practice</span> : null}
            </div>
            {skill.knowledgeReason ? <p className="mt-1 text-xs text-muted">{skill.knowledgeReason}</p> : null}
          </div>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-forge" />
        </Link>
      ) : null}
      <details className="mt-1 text-sm text-muted" data-testid={`tracker-requirements-${skill.skillPathId}`}>
        <summary aria-label={`View official requirements for ${skill.name}`} className="min-h-10 w-fit cursor-pointer py-2 text-xs font-semibold underline-offset-4 hover:underline">
          Official requirements ({skill.officialPoints.length})
        </summary>
        <ul className="grid gap-2 border-l-2 border-line pb-2 pl-3 leading-relaxed">
          {skill.officialPoints.map((point) => <li key={point.id} data-testid="course-tracker-official-point" data-official-point-id={point.id}><span className="font-bold text-ink">{point.reference}:</span> {point.text}</li>)}
        </ul>
      </details>
    </li>
  );
}
