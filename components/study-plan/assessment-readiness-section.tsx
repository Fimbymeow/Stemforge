"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { CONFIDENCE_LABEL } from "@/components/confidence/confidence-control";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import type { ProgressEvidence } from "@/lib/progress/types";
import {
  deriveCourseAssessmentReadiness,
  type AssessmentReadinessSummary,
  type AssessmentSkillReadiness,
} from "@/lib/readiness/derivation";
import {
  presentAssessmentTiming,
  presentReadinessCounts,
  READINESS_REASON_LABEL,
  READINESS_STATE_LABEL,
} from "@/lib/readiness/presenter";
import { presentAssessmentScopeSummary } from "@/lib/study-plan/presenter";
import type { Assessment } from "@/lib/study-plan/types";

const SMALL_SCOPE_LIMIT = 8;

export function AssessmentReadinessSection({
  assessments,
  courseSlug,
  evidence,
}: {
  assessments: readonly Assessment[];
  courseSlug: string;
  evidence: ProgressEvidence;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const confidence = useLearnerConfidence();
  useEffect(() => setNow(new Date()), []);
  const confidenceBySkill = useMemo(() => new Map(Object.entries(confidence.ratings).map(([id, value]) => [id, value.level])), [confidence.ratings]);
  const model = useMemo(() => now ? deriveCourseAssessmentReadiness({
    courseSlug,
    assessments,
    evidence,
    learnerConfidence: confidenceBySkill,
    now,
  }) : null, [assessments, confidenceBySkill, courseSlug, evidence, now]);

  if (!model || !now || model.assessments.length === 0) return null;
  const currentNow = now;
  return (
    <section aria-labelledby="assessment-readiness-title" data-testid="assessment-readiness" className="mt-6">
      <div className="mb-3">
        <h2 id="assessment-readiness-title" className="text-lg font-extrabold">Upcoming assessments</h2>
        <p className="mt-1 text-sm text-muted">A focused view of the course evidence Orthic can currently see.</p>
      </div>
      <div className="space-y-3">
        {model.assessments.map((summary) => <AssessmentCard key={summary.assessment.id} summary={summary} courseSlug={courseSlug} now={currentNow} />)}
      </div>
    </section>
  );
}

function AssessmentCard({ summary, courseSlug, now }: { summary: AssessmentReadinessSummary; courseSlug: string; now: Date }) {
  const small = summary.totalCanonicalSkillCount <= SMALL_SCOPE_LIMIT;
  const coverage = summary.unavailableSkillCount > 0
    ? summary.assessment.scope.kind === "whole_course"
      ? `Orthic can currently assess ${summary.supportedSkillCount} of ${summary.totalCanonicalSkillCount} course skills.`
      : `Orthic can currently assess ${summary.supportedSkillCount} of ${summary.totalCanonicalSkillCount} skills on this assessment.`
    : null;
  return (
    <article data-testid="assessment-readiness-card" className="rounded-xl border border-line bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-extrabold text-ink">{summary.assessment.title}</h3>
          <p className="mt-1 text-sm text-muted">{presentAssessmentTiming(summary.assessment, now)} · {presentAssessmentScopeSummary(summary.assessment.scope, courseSlug)}</p>
        </div>
        <p className="text-sm font-bold text-ink" aria-label={`Readiness: ${presentReadinessCounts(summary.counts)}`}>{presentReadinessCounts(summary.counts)}</p>
      </div>
      {coverage ? <p data-testid="assessment-coverage" className="mt-3 text-sm text-muted">{coverage}</p> : null}
      {summary.bestFocus ? <BestFocus skill={summary.bestFocus} />
        : summary.supportedSkillCount > 0 ? <p className="mt-4 text-sm text-muted">No current action is due across the supported skills.</p> : null}
      {small ? <div className="mt-4 border-t border-line"><SkillRows skills={summary.skills} showTopic={false} /></div>
        : <LargeScopeDetails summary={summary} />}
    </article>
  );
}

function BestFocus({ skill }: { skill: AssessmentSkillReadiness }) {
  const reason = skill.reasons[0] ? READINESS_REASON_LABEL[skill.reasons[0]] : null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-2 border-forge pl-3" data-testid="assessment-best-focus">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Useful next focus</p>
        <p className="mt-0.5 text-sm font-extrabold text-ink">{skill.skillName}{reason ? <span className="font-medium text-muted"> · {reason}</span> : null}</p>
      </div>
      {skill.action ? <Link href={skill.action.href} className="inline-flex min-h-10 items-center rounded-lg bg-forge px-3 text-sm font-extrabold text-white">{skill.action.label}</Link> : null}
    </div>
  );
}

function LargeScopeDetails({ summary }: { summary: AssessmentReadinessSummary }) {
  const supported = summary.skills.filter((skill) => skill.coverage === "supported");
  const unavailable = summary.skills.filter((skill) => skill.coverage === "content_unavailable");
  const preview = supported.filter((skill) => skill.state === "needs_attention").slice(0, 3);
  const groups = groupByTopic(supported);
  return (
    <div className="mt-4 border-t border-line pt-3">
      <details className="group">
        {preview.length ? <div className="mb-3 group-open:hidden"><p className="text-xs font-extrabold uppercase tracking-wide text-muted">Needs attention</p><SkillRows skills={preview} compact /></div> : null}
        <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 text-sm font-extrabold text-forge focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge">
          View readiness <ChevronRight aria-hidden="true" className="size-4 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-2">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`readiness-topic-${summary.assessment.id}-${group.id}`} className="mt-4 first:mt-0">
              <h4 id={`readiness-topic-${summary.assessment.id}-${group.id}`} className="text-xs font-extrabold uppercase tracking-wide text-muted">{group.name}</h4>
              <div className="mt-1 border-t border-line"><SkillRows skills={group.skills} /></div>
            </section>
          ))}
          {unavailable.length ? (
            <details className="mt-4 border-t border-line pt-2">
              <summary className="min-h-10 cursor-pointer py-2 text-sm font-bold text-muted">Not available in Orthic yet ({unavailable.length})</summary>
              <SkillRows skills={unavailable} />
            </details>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function SkillRows({ skills, compact = false, showTopic = true }: { skills: readonly AssessmentSkillReadiness[]; compact?: boolean; showTopic?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {skills.map((skill) => {
        const reason = skill.reasons[0] ? READINESS_REASON_LABEL[skill.reasons[0]] : null;
        return (
          <li key={skill.skillPathId} data-testid="assessment-skill-row" className={`flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 ${compact ? "py-2" : "py-3"}`}>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{skill.skillName}</p>
              {!compact ? <p className="mt-0.5 text-xs text-muted">{showTopic ? `${skill.topicName} · ` : ""}{reason}{skill.learnerConfidence ? ` · Your confidence: ${CONFIDENCE_LABEL[skill.learnerConfidence]}` : ""}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={stateClass(skill)}>{skill.state ? READINESS_STATE_LABEL[skill.state] : "Not available"}</span>
              {skill.action && !compact ? <Link href={skill.action.href} aria-label={`${skill.action.label}: ${skill.skillName}`} className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-extrabold text-forge">{skill.action.label}</Link> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function groupByTopic(skills: readonly AssessmentSkillReadiness[]) {
  const groups = new Map<string, { id: string; name: string; skills: AssessmentSkillReadiness[] }>();
  for (const skill of skills) {
    const group = groups.get(skill.topicId) ?? { id: skill.topicId.replace(/[^a-z0-9-]/gi, "-"), name: skill.topicName, skills: [] };
    group.skills.push(skill);
    groups.set(skill.topicId, group);
  }
  return [...groups.values()];
}

function stateClass(skill: AssessmentSkillReadiness) {
  const base = "rounded-full px-2 py-1 text-xs font-extrabold";
  if (skill.coverage === "content_unavailable") return `${base} bg-paper text-muted`;
  if (skill.state === "needs_attention") return `${base} bg-amber-50 text-amber-900`;
  if (skill.state === "secure") return `${base} bg-emerald-50 text-emerald-800`;
  return `${base} bg-forge-soft text-forge`;
}
