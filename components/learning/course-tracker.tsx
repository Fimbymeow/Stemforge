"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Subject } from "@/data/types";
import { deriveHigherMathsCourseTracker } from "@/lib/course-tracker";
import type { CourseTrackerRequirement, CourseTrackerSkill } from "@/lib/course-tracker";
import { groupCourseTrackerSkills, hasCourseTrackerConfidenceDisagreement } from "@/lib/course-tracker-presentation";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import { isCompletedTierStatus, MasteryMark } from "@/components/learning/mastery-badge";

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
      <div className="border-b border-line pb-3">
        <h2 className="text-lg font-extrabold">Skills by course area</h2>
        <p className="mt-1 text-sm text-muted">Select an area, scan its skills and expand official detail only when needed.</p>
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
            {area.requirements.map((requirement) => <TrackerRequirement key={requirement.areaId} requirement={requirement} />)}
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

function TrackerRequirement({ requirement }: { requirement: CourseTrackerRequirement }) {
  const groups = groupCourseTrackerSkills(requirement.skills);
  return (
    <section aria-labelledby={`tracker-topic-${requirement.areaId}`} className="py-5">
      <h4 id={`tracker-topic-${requirement.areaId}`} className="text-sm font-extrabold text-muted">{requirement.title}</h4>
      <ul className="mt-3 divide-y divide-line border-y border-line" aria-label={`${requirement.title} Higher Maths skills`}>
        {groups.map((group, index) => group.kind === "actionable"
          ? <TrackerSkillRow key={group.skill.skillPathId} skill={group.skill} />
          : <CurriculumReferenceGroup key={`${group.skills[0].skillPathId}-${index}`} requirementTitle={requirement.title} skills={group.skills} />)}
      </ul>
    </section>
  );
}

function TrackerSkillRow({ skill }: { skill: CourseTrackerSkill }) {
  if (!skill.action || !skill.progressLabel) return null;
  const showMasteryMark = Boolean(skill.masteryStatus && isCompletedTierStatus(skill.masteryStatus));
  const confidenceDisagrees = hasCourseTrackerConfidenceDisagreement(skill.confidence);
  return (
    <li className="min-w-0 py-1" data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-skill="" data-tracker-row-kind="actionable">
      <Link href={skill.action.href} aria-label={`Open ${skill.name} skill overview`} className="grid min-h-14 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-sm px-2 py-3 transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge">
        <span className="min-w-0">
          <span className="block break-words text-sm font-extrabold text-ink">{skill.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span data-testid={`tracker-progress-${skill.skillPathId}`}>{skill.progressLabel}</span>
            {showMasteryMark && skill.masteryStatus ? <MasteryMark status={skill.masteryStatus} density="compact" /> : null}
          </span>
          {confidenceDisagrees ? <span className="mt-1 block text-xs text-muted" data-testid={`tracker-confidence-disagreement-${skill.skillPathId}`}>Your confidence and recent evidence differ</span> : null}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {skill.reviewDue ? <span className="text-xs font-bold text-warning" data-review-state="due">Review due</span> : null}
          <ArrowRight aria-hidden="true" className="size-4 text-forge" />
        </span>
      </Link>
      <details className="group/requirements disclosure-motion text-sm text-muted" data-testid={`tracker-requirements-${skill.skillPathId}`}>
        <summary aria-label={`View official requirements for ${skill.name}`} className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 px-2 py-2 text-xs font-semibold underline-offset-4 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge">
          Official requirements ({skill.officialPoints.length}) <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open/requirements:rotate-180" />
        </summary>
        <ul className="grid gap-2 border-l-2 border-line pb-2 pl-3 leading-relaxed">
          {skill.officialPoints.map((point) => <li key={point.id} data-testid="course-tracker-official-point" data-official-point-id={point.id}><span className="font-bold text-ink">{point.reference}:</span> {point.text}</li>)}
        </ul>
      </details>
    </li>
  );
}

function CurriculumReferenceGroup({ requirementTitle, skills }: { requirementTitle: string; skills: CourseTrackerSkill[] }) {
  return (
    <li className="px-2 py-3" data-course-tracker-reference-group="">
      <h5 className="text-xs font-extrabold text-muted">Further skills in this strand</h5>
      <ul className="mt-1 divide-y divide-line" aria-label={`Further skills in ${requirementTitle}`}>
        {skills.map((skill) => (
          <li key={skill.skillPathId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2 text-sm" data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-reference="">
            <span className="min-w-0 break-words font-semibold text-ink">{skill.name}</span>
            <span className="text-right text-xs text-muted">{skill.officialPoints.length} official requirement{skill.officialPoints.length === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}
