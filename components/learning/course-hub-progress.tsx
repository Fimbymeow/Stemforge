"use client";

import { useEffect, useState } from "react";
import type { Subject } from "@/data/types";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveCourseDashboardSummary } from "@/lib/dashboard-derivations";
import { contentResolver } from "@/lib/content-resolver";
import { getStrandSkillPaths } from "@/lib/course-hub-presentation";

export function CourseHubProgress({ subject }: { subject: Subject }) {
  const [evidence, setEvidence] = useState(getEmptyProgressEvidence);
  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    const events = ["stemforge:local-progress-updated", "stemforge:progress-sync-updated", "storage"];
    events.forEach((event) => window.addEventListener(event, update));
    return () => events.forEach((event) => window.removeEventListener(event, update));
  }, []);
  const paths = subject.courseAreas.flatMap(getStrandSkillPaths);
  const summary = deriveCourseDashboardSummary(paths, evidence, contentResolver.getQuestionVersions(), subject);
  // Skills learned out of the whole curriculum, not question completion or confidence.
  const percentage = paths.length ? Math.round(summary.completedPathCount / paths.length * 100) : 0;
  return <div data-testid="course-hub-progress" className="shrink-0 text-right max-sm:text-left" aria-label={`Course progress: ${summary.completedPathCount} of ${paths.length} skills learned, ${percentage}%`}>
    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">Course progress</p>
    <div className="mt-1 flex items-baseline justify-end gap-3 max-sm:justify-start"><span className="text-sm text-secondary">{summary.completedPathCount} / {paths.length} skills learned</span><span className="text-3xl font-semibold tabular-nums text-navy">{percentage}%</span></div>
  </div>;
}
