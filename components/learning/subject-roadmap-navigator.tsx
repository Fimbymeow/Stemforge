"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseArea, SkillPath, Subject } from "@/data/types";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { getActionableSpecificationGroups } from "@/lib/course-hub-presentation";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import { getCourseAreaAnchorId, getCourseAreaSlugFromHash } from "@/lib/course-area-navigation";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import { COURSE_TRACKER_STATUS_DOT, getSkillStatusLabel, getSkillStatusTone } from "@/lib/course-tracker-presentation";

function initialStrandIndex(strands: CourseArea[]) {
  const available = strands.findIndex((strand) => strand.specAreas.some((area) => area.skillPaths?.some((path) => path.isAvailable)));
  return available >= 0 ? available : 0;
}

export function SubjectRoadmapNavigator({ subject }: { subject: Subject }) {
  const strands = subject.courseAreas;
  const [strandIndex, setStrandIndex] = useState(() => initialStrandIndex(strands));
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const confidence = useLearnerConfidence();
  const learnerConfidenceMap = useMemo(
    () => new Map(Object.values(confidence.ratings).map((rating) => [rating.skillPathId, rating.level])),
    [confidence.ratings],
  );
  const strand = strands[strandIndex];

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

  useEffect(() => {
    const selectCourseAreaFromHash = () => {
      const courseAreaSlug = getCourseAreaSlugFromHash(window.location.hash);
      if (!courseAreaSlug) return;
      const index = strands.findIndex((item) => item.slug === courseAreaSlug);
      if (index >= 0) setStrandIndex(index);
    };
    selectCourseAreaFromHash();
    window.addEventListener("hashchange", selectCourseAreaFromHash);
    return () => window.removeEventListener("hashchange", selectCourseAreaFromHash);
  }, [strands]);

  const groups = useMemo(
    () => strand ? getActionableSpecificationGroups(strand) : [],
    [strand],
  );

  if (!strand) return null;

  return (
    <div className="min-w-0 max-w-full" data-testid="subject-roadmap">
      <nav aria-label="Course strands" className="grid grid-cols-1 gap-2 min-[375px]:grid-cols-2 lg:grid-cols-4">
        {strands.map((item, index) => <button id={getCourseAreaAnchorId(item.slug)} key={item.slug} type="button" onClick={() => setStrandIndex(index)} aria-pressed={strandIndex === index} aria-current={strandIndex === index ? "true" : undefined} aria-controls="course-strand-skills" className={`orthic-stage min-h-14 scroll-mt-24 rounded-sm border px-4 py-3 text-left text-sm font-medium leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${strandIndex === index ? "border-navy bg-academic-blue text-navy" : "border-rule bg-white text-secondary"}`}>{item.name}</button>)}
      </nav>

      <section key={strand.slug} id="course-strand-skills" className="mt-6 min-w-0" aria-labelledby="selected-strand-title" data-testid={`roadmap-strand-${strand.slug}`}>
        <div className="mb-5">
          <h3 id="selected-strand-title" className="text-lg font-semibold text-navy">{strand.name} skills</h3>
        </div>
        {groups.length ? (
          <div className="space-y-7">{groups.map((group) => <section key={group.id} aria-labelledby={`group-${group.id}`} data-testid={`spec-group-${group.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3"><h4 id={`group-${group.id}`} className="text-base font-semibold text-navy">{group.title}</h4><span className="font-mono text-[11px] text-secondary">{group.paths.length} available skill{group.paths.length === 1 ? "" : "s"}</span></div>
            <ul className="divide-y divide-rule border-b border-rule" aria-label={`${group.title} learning activities`}>
              {group.paths.map((path) => <RoadmapSkillRow key={path.slug} path={path} evidence={evidence} learnerConfidence={learnerConfidenceMap.get(path.slug)} />)}
            </ul>
          </section>)}</div>
        ) : (
          <p className="px-4 py-5 text-sm text-muted sm:px-5" role="status">This area has no learning activities to show right now.</p>
        )}
      </section>
    </div>
  );
}

function RoadmapSkillRow({ path, evidence, learnerConfidence }: { path: SkillPath; evidence: ProgressEvidence; learnerConfidence?: "needs_work" | "developing" | "confident" }) {
  const review = deriveSkillReviewState(path, evidence);
  const statusTone = getSkillStatusTone({
    reviewDue: review.eligible && review.due && review.reason !== "history_unavailable",
    learnerConfidence,
  });
  return (
    <li data-testid={`roadmap-skill-${path.slug}`}>
      <Link href={path.href} aria-label={`Open ${path.name} skill overview. ${getSkillStatusLabel(statusTone)}`} className="orthic-course-row orthic-secondary-link grid min-h-14 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-rule px-3 py-4 text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${COURSE_TRACKER_STATUS_DOT[statusTone]}`} data-testid={`roadmap-status-${path.slug}`} data-roadmap-status={statusTone} />
        <span className="min-w-0 break-words font-semibold">{path.name}</span>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-secondary">Open<ArrowRight aria-hidden="true" className="orthic-arrow size-4 text-navy" /></span>
      </Link>
    </li>
  );
}
