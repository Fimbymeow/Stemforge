"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseArea, SkillPath, Subject } from "@/data/types";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import type { ProgressEvidence, ProgressStatus } from "@/lib/progress/types";
import { MasteryMark } from "@/components/learning/mastery-badge";
import { InlineMathContent } from "@/components/questions/math-content";
import { getActionableStrandSkillPaths } from "@/lib/course-hub-presentation";

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

  const actionableSkills = useMemo(
    () => strand ? getActionableStrandSkillPaths(strand) : [],
    [strand],
  );

  if (!strand) return null;

  return (
    <div className="min-w-0 max-w-full" data-testid="subject-roadmap">
      <nav aria-label="Course strands" className="grid grid-cols-1 gap-2 min-[375px]:grid-cols-2 lg:grid-cols-4">
        {strands.map((item, index) => <button key={item.slug} type="button" onClick={() => setStrandIndex(index)} aria-pressed={strandIndex === index} aria-current={strandIndex === index ? "true" : undefined} aria-controls="course-strand-skills" className={`orthic-stage min-h-14 rounded-sm border px-4 py-3 text-left text-sm font-medium leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${strandIndex === index ? "border-navy bg-academic-blue text-navy" : "border-rule bg-white text-secondary"}`}>{item.name}</button>)}
      </nav>

      <section key={strand.slug} id="course-strand-skills" className="mt-5 overflow-hidden rounded-sm border border-rule bg-white" aria-labelledby="selected-strand-title" data-testid={`roadmap-strand-${strand.slug}`}>
        <div className="border-b border-rule bg-academic-blue/40 px-5 py-4">
          <h3 id="selected-strand-title" className="text-lg font-semibold text-navy">{strand.name} skills</h3>
        </div>
        {actionableSkills.length ? (
          <ul className="divide-y divide-rule" aria-label={`${strand.name} learning activities`}>
            {actionableSkills.map((path) => <RoadmapSkillRow key={path.slug} path={path} evidence={evidence} />)}
          </ul>
        ) : (
          <p className="px-4 py-5 text-sm text-muted sm:px-5" role="status">This area has no learning activities to show right now.</p>
        )}
      </section>
    </div>
  );
}

function RoadmapSkillRow({ path, evidence }: { path: SkillPath; evidence: ProgressEvidence }) {
  const status = topicStatus(path, evidence);
  return (
    <li data-testid={`roadmap-skill-${path.slug}`}>
      <Link href={path.href} className="orthic-course-row orthic-secondary-link flex min-h-14 flex-wrap items-center justify-between gap-4 border-rule px-5 py-5 text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy">
        <span className="min-w-0 flex-1 max-sm:basis-full"><span className="block text-base font-semibold">{path.name}</span><span className="mt-2 block text-sm font-normal leading-relaxed text-secondary"><InlineMathContent>{path.description}</InlineMathContent></span></span>
        <span className="flex flex-wrap items-center gap-3 text-sm text-secondary">
          {status ? <MasteryMark status={status} density="labelled" /> : null}<span>Open</span><ArrowRight aria-hidden="true" className="orthic-arrow size-4 text-navy" />
        </span>
      </Link>
    </li>
  );
}
