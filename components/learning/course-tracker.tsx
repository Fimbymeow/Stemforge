"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Subject } from "@/data/types";
import { deriveHigherMathsCourseTracker } from "@/lib/course-tracker";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { ConfidenceControl } from "@/components/confidence/confidence-control";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import type { UseLearnerConfidenceResult } from "@/components/confidence/use-learner-confidence";
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
  const confidence = useLearnerConfidence();
  const learnerConfidenceMap = useMemo(
    () => new Map(Object.values(confidence.ratings).map((rating) => [rating.skillPathId, rating.level])),
    [confidence.ratings],
  );
  const model = useMemo(
    () => deriveHigherMathsCourseTracker(subject, evidence, undefined, undefined, learnerConfidenceMap),
    [subject, evidence, learnerConfidenceMap],
  );
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

      <nav aria-label="Course areas" className="min-w-0" data-testid="course-tracker-unit-navigation">
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="course-tracker-area-list">
          {model.areas.map((item, index) => {
            const isSelected = index === selectedArea;
            return (
              <button
                key={item.courseAreaId}
                type="button"
                aria-current={isSelected ? "page" : undefined}
                onClick={() => setSelectedArea(index)}
                className={`min-h-11 min-w-max flex-1 whitespace-nowrap rounded-lg border px-3 py-2 text-left text-sm font-extrabold leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge ${isSelected ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-ink hover:border-forge/50 hover:bg-paper"}`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </nav>

      {area ? (
        <section aria-labelledby={`tracker-area-${area.courseAreaId}`} className="min-w-0" data-testid={`tracker-area-${area.courseAreaId}`}>
          <h3 id={`tracker-area-${area.courseAreaId}`} className="border-b border-ink pb-3 text-xl font-extrabold">{area.title}</h3>
          <div className="divide-y divide-line">
            {area.requirements.map((requirement) => (
              <section key={requirement.areaId} aria-labelledby={`tracker-topic-${requirement.areaId}`} className="py-5">
                <h4 id={`tracker-topic-${requirement.areaId}`} className="text-sm font-extrabold text-muted">{requirement.title}</h4>
                <ul className="mt-3 divide-y divide-line border-y border-line" aria-label={`${requirement.title} Orthic skills`}>
                  {requirement.skills.map((skill) => <TrackerSkillRow key={skill.skillPathId} skill={skill} confidence={confidence} />)}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <details className="disclosure-motion border-t border-line pt-3" data-testid="course-wide-requirements">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-extrabold">Reasoning across the course</summary>
        <p className="mb-3 text-sm text-muted">These requirements develop through contextual skills rather than separate learning paths.</p>
        <div className="grid gap-2">
          {model.courseWideRequirements.map((requirement) => (
            <details key={requirement.areaId} className="disclosure-motion border-b border-line">
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

function TrackerSkillRow({ skill, confidence }: {
  skill: ReturnType<typeof deriveHigherMathsCourseTracker>["areas"][number]["requirements"][number]["skills"][number];
  confidence: UseLearnerConfidenceResult;
}) {
  const isComingSoon = skill.availability === "Coming soon";
  const reviewState = getReviewPresentationState({ eligible: skill.reviewEligible, due: skill.reviewDue, dueSoon: skill.reviewDueSoon });
  return (
    <li className={`min-w-0 ${isComingSoon ? "py-2" : "py-3"}`} data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-skill="">
      {isComingSoon ? (
        <div className="flex min-h-11 min-w-0 items-center gap-3 px-2">
          <h5 className="min-w-0 flex-1 break-words text-sm font-extrabold text-muted">{skill.name}</h5>
          <span className="text-xs font-bold text-muted">Coming soon</span>
        </div>
      ) : skill.action ? (
        // A confidence control here is genuinely interactive (opens a menu), so it can't nest inside
        // the row's own navigation link without producing invalid, unreliable nested-interactive HTML.
        // The Link now wraps only the title/description; the badge stack (incl. confidence) sits as a
        // sibling, matching the same Link-plus-sibling-menu structure already used in StudyPlanItemRow.
        <div className={`flex min-h-14 min-w-0 items-center gap-3 rounded-sm px-2 transition-colors hover:bg-paper ${skill.structuralStatus === "In progress" ? "border-l-2 border-forge bg-forge-soft/35 pl-3" : ""}`}>
          <Link href={skill.action.href} aria-label={`Open ${skill.name} skill overview`} className="min-w-0 flex-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge">
            <h5 className="break-words text-sm font-extrabold text-ink">{skill.name}</h5>
            {skill.knowledgeReason ? <p className="mt-1 text-xs text-muted"><span className="font-bold text-ink">Needs practice</span> · {skill.knowledgeReason}</p> : null}
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {skill.masteryStatus ? <MasteryMark status={skill.masteryStatus} density="labelled" /> : null}
            {(skill.reviewEligible || skill.reviewDue || skill.reviewDueSoon) ? <ReviewStatus state={reviewState} compact /> : null}
            {skill.confidence ? (
              <ConfidenceControl
                skillPathId={skill.skillPathId}
                skillName={skill.name}
                confidence={confidence}
                suggestion={skill.confidence.suggestion}
                evidenceFingerprint={skill.confidence.evidenceFingerprint}
                variant="compact"
                className="text-right"
              />
            ) : null}
          </div>
          <Link href={skill.action.href} aria-hidden="true" tabIndex={-1} className="shrink-0">
            <ArrowRight aria-hidden="true" className="size-4 text-forge" />
          </Link>
        </div>
      ) : null}
      <details className="mt-1 group/requirements disclosure-motion text-sm text-muted" data-testid={`tracker-requirements-${skill.skillPathId}`}>
        <summary aria-label={`View official requirements for ${skill.name}`} className="flex min-h-10 w-fit cursor-pointer list-none items-center gap-1.5 px-2 py-2 text-xs font-semibold underline-offset-4 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge">
          Official requirements ({skill.officialPoints.length}) <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open/requirements:rotate-180" />
        </summary>
        <ul className="grid gap-2 border-l-2 border-line pb-2 pl-3 leading-relaxed">
          {skill.officialPoints.map((point) => <li key={point.id} data-testid="course-tracker-official-point" data-official-point-id={point.id}><span className="font-bold text-ink">{point.reference}:</span> {point.text}</li>)}
        </ul>
      </details>
    </li>
  );
}
