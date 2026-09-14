"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseArea, SkillPath, Subject } from "@/data/types";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { getActionableSpecificationGroups } from "@/lib/course-hub-presentation";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import { derivePathDashboardSummary } from "@/lib/dashboard-derivations";
import { contentResolver } from "@/lib/content-resolver";

function initialStrandIndex(strands: CourseArea[]) {
  const available = strands.findIndex((strand) => strand.specAreas.some((area) => area.skillPaths?.some((path) => path.isAvailable)));
  return available >= 0 ? available : 0;
}

export function SubjectRoadmapNavigator({ subject }: { subject: Subject }) {
  const strands = subject.courseAreas;
  const [strandIndex, setStrandIndex] = useState(() => initialStrandIndex(strands));
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
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

  const groups = useMemo(
    () => strand ? getActionableSpecificationGroups(strand) : [],
    [strand],
  );

  if (!strand) return null;

  return (
    <div className="min-w-0 max-w-full" data-testid="subject-roadmap">
      <nav aria-label="Course strands" className="grid grid-cols-1 gap-2 min-[375px]:grid-cols-2 lg:grid-cols-4">
        {strands.map((item, index) => <button key={item.slug} type="button" onClick={() => setStrandIndex(index)} aria-pressed={strandIndex === index} aria-current={strandIndex === index ? "true" : undefined} aria-controls="course-strand-skills" className={`orthic-stage min-h-14 rounded-sm border px-4 py-3 text-left text-sm font-medium leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${strandIndex === index ? "border-navy bg-academic-blue text-navy" : "border-rule bg-white text-secondary"}`}>{item.name}</button>)}
      </nav>

      <section key={strand.slug} id="course-strand-skills" className="mt-6 min-w-0" aria-labelledby="selected-strand-title" data-testid={`roadmap-strand-${strand.slug}`}>
        <div className="mb-5">
          <h3 id="selected-strand-title" className="text-lg font-semibold text-navy">{strand.name} skills</h3>
        </div>
        {groups.length ? (
          <div className="space-y-7">{groups.map((group) => <section key={group.id} aria-labelledby={`group-${group.id}`} data-testid={`spec-group-${group.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3"><h4 id={`group-${group.id}`} className="text-base font-semibold text-navy">{group.title}</h4><span className="font-mono text-[11px] text-secondary">{group.paths.length} available skill{group.paths.length === 1 ? "" : "s"}</span></div>
            <ul className="divide-y divide-rule border-b border-rule" aria-label={`${group.title} learning activities`}>
              {group.paths.map((path) => <RoadmapSkillRow key={path.slug} path={path} evidence={evidence} />)}
            </ul>
          </section>)}</div>
        ) : (
          <p className="px-4 py-5 text-sm text-muted sm:px-5" role="status">This area has no learning activities to show right now.</p>
        )}
      </section>
    </div>
  );
}

function RoadmapSkillRow({ path, evidence }: { path: SkillPath; evidence: ProgressEvidence }) {
  const progress = getSkillPathProgress(path, evidence);
  const summary = derivePathDashboardSummary(path, evidence, contentResolver.getQuestionVersions());
  const stage = summary.stageSummaries.find((item) => item.stageId === summary.currentStageId);
  const accuracy = progress.latestAttemptAccuracyPercentage;
  const review = deriveSkillReviewState(path, evidence);
  return (
    <li data-testid={`roadmap-skill-${path.slug}`}>
      <Link href={path.href} className="orthic-course-row orthic-secondary-link flex min-h-14 flex-wrap items-center justify-between gap-3 border-rule px-3 py-4 text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy">
        <span className="min-w-0 flex-1 font-semibold max-sm:basis-full">{path.name}</span>
        <span className="flex flex-wrap items-center gap-3 text-sm text-secondary">
          <span>{progress.attemptedCount === 0 ? "Not started" : progress.completedQuestionIds.length === progress.totalQuestions ? "Learning complete" : `${summary.currentStageName === "Past Paper-style Questions" ? "Exam practice" : summary.currentStageName} ${stage?.completedQuestions ?? 0}/${stage?.totalQuestions ?? 0}`}</span>
          {accuracy !== null ? <span aria-label={`Latest answer accuracy: ${accuracy}%`} className={`tabular-nums ${accuracy === 100 ? "text-navy" : accuracy === 0 ? "text-red-800" : "text-amber-800"}`}>{accuracy}%</span> : null}
          {review.eligible && review.due && review.reason !== "history_unavailable" ? <span className="text-xs text-amber-800">Review due</span> : null}
          <span>Open</span><ArrowRight aria-hidden="true" className="orthic-arrow size-4 text-navy" />
        </span>
      </Link>
    </li>
  );
}
