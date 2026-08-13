"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IconNodePath } from "@/components/learning/icon-node-path";
import type { CourseArea, SkillPath, Subject } from "@/data/types";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import type { ProgressEvidence, ProgressStatus } from "@/lib/progress/types";
import { MasteryMark } from "@/components/learning/mastery-badge";

function initialStrandIndex(strands: CourseArea[]) {
  const available = strands.findIndex((strand) => strand.specAreas.some((area) => area.skillPaths?.some((path) => path.isAvailable)));
  return available >= 0 ? available : 0;
}

function topicStatus(path: SkillPath, evidence: ProgressEvidence): ProgressStatus | null {
  return path.isAvailable ? getSkillPathProgress(path, evidence).status : null;
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

  const topics = useMemo(
    () => strand?.specAreas.flatMap((area) => area.skillPaths ?? []) ?? [],
    [strand],
  );

  if (!strand) return null;

  return (
    <div className="min-w-0 max-w-full" data-testid="subject-roadmap">
      <nav aria-label="Course strands">
        <IconNodePath
          items={strands.map((item) => ({
            id: item.slug,
            label: item.name,
            available: item.specAreas.some((area) => area.skillPaths?.some((path) => path.isAvailable)),
          }))}
          selectedIndex={strandIndex}
          onSelect={setStrandIndex}
        />
      </nav>

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="selected-strand-title">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <h3 id="selected-strand-title" className="text-base font-extrabold">{strand.name}</h3>
          <p className="mt-1 text-sm text-muted">Choose a skill to continue learning.</p>
        </div>
        {topics.length ? (
          <ul className="divide-y divide-line" aria-label={`${strand.name} skills`}>
            {topics.map((path) => {
              const status = topicStatus(path, evidence);
              return (
                <li key={path.slug}>
                  {path.isAvailable ? (
                    <Link href={path.href} className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition hover:bg-forge-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-forge sm:px-5">
                      <span className="min-w-0 font-extrabold">{path.name}</span>
                      <span className="flex shrink-0 items-center gap-3 text-sm font-bold text-muted">
                        {status ? <MasteryMark status={status} density="labelled" /> : null}<ArrowRight aria-hidden="true" className="size-4 text-forge" />
                      </span>
                    </Link>
                  ) : (
                    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:px-5">
                      <span className="min-w-0 font-bold text-muted">{path.name}</span>
                      <span className="shrink-0 text-sm font-bold text-muted">Coming soon</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-5 text-sm text-muted sm:px-5">Skills for this strand are coming soon.</p>
        )}
      </section>
    </div>
  );
}
