"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import type { Subject } from "@/data/types";
import { deriveHigherMathsCourseTracker } from "@/lib/course-tracker";
import type { CourseTrackerRequirement, CourseTrackerSkill } from "@/lib/course-tracker";
import { groupCourseTrackerSkills, hasCourseTrackerConfidenceDisagreement } from "@/lib/course-tracker-presentation";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import { CONFIDENCE_LABEL, CONFIDENCE_TEXT as CONFIDENCE_COLOR } from "@/components/confidence/confidence-presentation";

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
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8" data-testid="course-tracker">

      <nav aria-label="Course areas" className="min-w-0" data-testid="course-tracker-unit-navigation">
        <div className="grid grid-cols-2 gap-2 border-b border-rule pb-4 lg:grid-cols-4" data-testid="course-tracker-area-list">
          {model.areas.map((item, index) => {
            const isSelected = index === selectedArea;
            return (
              <button
                key={item.courseAreaId}
                type="button"
                aria-current={isSelected ? "page" : undefined}
                onClick={() => setSelectedArea(index)}
                className={`orthic-nav-link min-h-11 min-w-0 rounded border px-3 py-3 text-center text-sm font-medium leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${isSelected ? "border-navy bg-forge-soft text-navy" : "border-transparent text-secondary hover:border-rule hover:bg-white"}`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </nav>

      {area ? (
        <section aria-labelledby={`tracker-area-${area.courseAreaId}`} className="min-w-0" data-testid={`tracker-area-${area.courseAreaId}`}>
          <h2 id={`tracker-area-${area.courseAreaId}`} className="border-b border-rule pb-4 text-2xl font-bold tracking-tight">{area.title}</h2>
          <div className="grid gap-2">
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
    <section aria-labelledby={`tracker-topic-${requirement.areaId}`} className="pt-7">
      <h3 id={`tracker-topic-${requirement.areaId}`} className="text-[15px] font-semibold leading-relaxed text-navy">{requirement.title}</h3>
      <ul className="mt-3 divide-y divide-rule border-y border-rule" aria-label={`${requirement.title} Higher Maths skills`}>
        {groups.map((group, index) => group.kind === "actionable"
          ? <TrackerSkillRow key={group.skill.skillPathId} skill={group.skill} />
          : <CurriculumReferenceGroup key={`${group.skills[0].skillPathId}-${index}`} requirementTitle={requirement.title} skills={group.skills} />)}
      </ul>
    </section>
  );
}

function TrackerSkillRow({ skill }: { skill: CourseTrackerSkill }) {
  if (!skill.action) return null;
  const learnerConfidence = skill.confidence?.learnerLevel ?? null;
  const confidenceDisagrees = hasCourseTrackerConfidenceDisagreement(skill.confidence);
  return (
    <li className="min-w-0" data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-skill="" data-tracker-row-kind="actionable">
      <Link href={skill.reviewDue ? `/practice?review=1&path=${encodeURIComponent(skill.skillPathId)}` : skill.action.href} aria-label={skill.reviewDue ? `Review now: ${skill.name}` : `Open ${skill.name} skill overview`} className="orthic-course-row orthic-secondary-link grid min-h-14 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy max-sm:grid-cols-1">
        <span className="min-w-0 break-words text-[15px] font-medium text-navy">{skill.name}</span>
        <span className="flex items-center justify-end gap-4 text-[13px] text-secondary max-sm:justify-between">
          {learnerConfidence ? (
            <span className={`inline-flex items-center gap-1 ${CONFIDENCE_COLOR[learnerConfidence]}`} data-testid={`tracker-confidence-${skill.skillPathId}`}>
              {CONFIDENCE_LABEL[learnerConfidence]}
              {confidenceDisagrees ? (
                <span
                  role="img"
                  aria-label="Your confidence and recent evidence differ"
                  title="Your confidence and recent evidence differ"
                  className="inline-flex text-warning"
                  data-testid={`tracker-confidence-disagreement-${skill.skillPathId}`}
                >
                  <CircleAlert aria-hidden="true" className="size-3.5" />
                </span>
              ) : null}
            </span>
          ) : <span className="text-muted" data-testid={`tracker-confidence-${skill.skillPathId}`}>Unrated</span>}
          <span className={`inline-flex min-w-[100px] items-center justify-end gap-2 font-medium ${skill.reviewDue ? "text-warning" : "text-secondary"}`} data-review-state={skill.reviewDue ? "due" : undefined}>
            {skill.reviewDue ? "Review now" : "Open"}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" />
          </span>
        </span>
      </Link>
    </li>
  );
}

function CurriculumReferenceGroup({ requirementTitle, skills }: { requirementTitle: string; skills: CourseTrackerSkill[] }) {
  return (
    <li data-course-tracker-reference-group="">
      <ul className="divide-y divide-rule" aria-label={`Further skills in ${requirementTitle}`}>
        {skills.map((skill) => (
          <li key={skill.skillPathId} className="grid min-h-14 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 max-sm:grid-cols-1" data-testid={`tracker-skill-${skill.skillPathId}`} data-course-tracker-reference="">
            <span className="min-w-0 break-words text-[15px] font-normal text-secondary">{skill.name}</span>
            <span className="text-right font-mono text-[11px] text-secondary max-sm:text-left">{skill.officialPoints.length} official requirement{skill.officialPoints.length === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}
