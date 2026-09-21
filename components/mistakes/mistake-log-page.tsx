"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Dumbbell, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { InlineMathContent } from "@/components/questions/math-content";
import { Eyebrow, PageHeaderIconChip, StatusPill } from "@/components/ui";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import {
  deriveMistakeLog,
  type MistakeItem,
  type MistakeSkillGroup,
} from "@/lib/mistakes/derivation";
import type { ProgressEvidence } from "@/lib/progress/types";

export function MistakeLogPage() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());

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

  const model = useMemo(() => deriveMistakeLog(evidence), [evidence]);
  const historyCount = model.historyGroups.reduce((total, group) => total + group.items.length, 0);

  return (
    <AppShell
      demo
      active="Subjects"
      contextBar={<><p className="font-mono text-xs uppercase tracking-[0.12em]">Higher Maths <span aria-hidden="true" className="mx-2 text-rule">/</span> Mistake Log</p><AppTopbar demo /></>}
      className="!px-10 py-8 max-md:!px-4 max-lg:pt-5"
      feedbackPlacement="inline-mobile"
    >
      <main className="mx-auto grid min-w-0 max-w-[1220px] gap-8 max-sm:gap-7" data-testid="mistake-log">
        <header className="grid gap-5">
          <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-navy">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-4 max-sm:grid-cols-1">
            <PageHeaderIconChip><BookOpen aria-hidden="true" className="size-5" /></PageHeaderIconChip>
            <div>
              <Eyebrow className="text-navy">Higher Maths</Eyebrow>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">Mistake Log</h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-secondary">A quiet record of questions to revisit, grouped by skill. Items clear automatically after later independent success.</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="open-mistakes-heading" className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
            <div>
              <h2 id="open-mistakes-heading" className="text-xl font-semibold text-navy">To revisit</h2>
              <p className="mt-2 text-sm text-secondary">Only unresolved mistakes from current question versions appear here.</p>
            </div>
            {model.openCount > 0 ? <p className="pb-1 text-sm font-medium text-navy">{mistakeCount(model.openCount, "unresolved mistake")}</p> : null}
          </div>

          {model.openGroups.length ? (
            <div className="grid gap-7">
              {model.openGroups.map((group) => (
                <MistakeGroup
                  key={group.skillPathId}
                  group={group}
                />
              ))}
            </div>
          ) : (
            <div className="border-b border-rule pb-7" data-testid="mistake-log-empty-state">
              <h3 className="font-semibold text-navy">No unresolved mistakes right now.</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">When a genuine graded attempt is incorrect, the question will appear here automatically.</p>
            </div>
          )}
        </section>

        {historyCount > 0 ? (
          <details className="disclosure-motion group border-t border-rule" data-testid="mistake-history-disclosure">
            <summary className="orthic-secondary-link flex min-h-14 cursor-pointer list-none items-center gap-2 py-3 text-sm font-medium text-secondary">
              <CheckCircle2 aria-hidden="true" className="size-4" /> Show resolved and previous-version history ({historyCount})
              <ChevronDown aria-hidden="true" className="orthic-disclosure-chevron ml-auto size-4 group-open:rotate-180" />
            </summary>
            <div className="grid gap-7 pb-6 pt-2">
              {model.historyGroups.map((group) => <MistakeGroup key={group.skillPathId} group={group} history />)}
            </div>
          </details>
        ) : null}
      </main>
    </AppShell>
  );
}

function MistakeGroup({
  group,
  history = false,
}: {
  group: MistakeSkillGroup;
  history?: boolean;
}) {
  const headingId = `${history ? "history" : "open"}-mistakes-${group.skillPathId}`;
  return (
    <section aria-labelledby={headingId} data-testid="mistake-skill-group" data-skill-path-id={group.skillPathId}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow as="h3" id={headingId} className={history ? "text-secondary" : "text-navy"}>{group.skillName}</Eyebrow>
          <p className="mt-2 text-sm text-secondary">{mistakeCount(group.items.length, history ? "history item" : "unresolved question")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!history ? (
            <Link
              href={`/subjects/higher-maths/question-bank?path=${encodeURIComponent(group.skillPathId)}&status=previously-incorrect`}
              aria-label={`Practise these ${group.skillName} questions`}
              className="orthic-course-action inline-flex min-h-11 items-center justify-center gap-2 rounded border border-rule bg-white px-4 text-sm font-medium text-navy"
            >
              <Dumbbell aria-hidden="true" className="size-4" /> Practise these
            </Link>
          ) : null}
          {group.officialRequirementCount > 0 ? (
            <Link href="/subjects/higher-maths/course-tracker" className="orthic-secondary-link inline-flex min-h-11 items-center py-2 text-sm text-secondary">
              View official requirements ({group.officialRequirementCount})
            </Link>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 divide-y divide-rule border-y border-rule" aria-label={`${group.skillName} ${history ? "mistake history" : "unresolved mistakes"}`}>
        {group.items.map((item) => <MistakeRow key={item.groupId} item={item} history={history} />)}
      </ul>
    </section>
  );
}

function MistakeRow({ item, history }: { item: MistakeItem; history: boolean }) {
  const stateLabel = item.state === "open"
    ? "Unresolved"
    : item.state === "historical"
      ? item.resolvedAt ? `Previous version · ${resolutionLabel(item)}` : "Previous version"
      : resolutionLabel(item);
  return (
    <li className={`orthic-plan-row grid gap-4 px-1 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-3 ${history ? "text-secondary" : ""}`} data-testid="mistake-item" data-mistake-state={item.state} data-question-id={item.questionId} data-question-version={item.questionVersion}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className={`font-semibold ${history ? "text-secondary" : "text-navy"}`}>Question {item.questionNumber}: <InlineMathContent>{item.questionTitle}</InlineMathContent></h4>
          <StatusPill variant={item.state === "open" ? "warning" : "neutral"}>{stateLabel}</StatusPill>
        </div>
        <p className="mt-2 text-sm text-secondary">
          {displayStageName(item.stageName)} · {mistakeCount(item.incorrectAttemptCount, "incorrect attempt")}
          {item.resolvedAt
            ? <> before resolving · Resolved <time dateTime={item.resolvedAt}>{formatDate(item.resolvedAt)}</time></>
            : <> · Last attempted <time dateTime={item.latestIncorrectAt}>{formatDate(item.latestIncorrectAt)}</time></>}
        </p>
        {item.wasReopened && item.state === "open" ? <p className="mt-1 text-xs text-secondary">Reopened after a later incorrect attempt.</p> : null}
        {item.representedInReviewRecovery ? <p className="mt-1 text-xs font-medium text-navy">Also represented in current Review recovery.</p> : null}
      </div>
      <nav aria-label={`Actions for ${item.skillName} question ${item.questionNumber}`} className="flex flex-wrap items-center gap-2 sm:justify-end">
        {item.state === "open" ? (
          <Link href={item.retryHref} aria-label={`Retry ${item.skillName} question ${item.questionNumber}`} className="orthic-primary-action inline-flex min-h-11 items-center justify-center gap-2 rounded bg-navy px-4 text-sm font-medium text-white">
            <RotateCcw aria-hidden="true" className="size-4" /> Retry
          </Link>
        ) : null}
        {item.notesHref ? <Link href={item.notesHref} className="orthic-secondary-link inline-flex min-h-11 items-center px-2 text-sm text-secondary">Notes</Link> : null}
        <Link href={item.practiceHref} className="orthic-secondary-link inline-flex min-h-11 items-center px-2 text-sm text-secondary">More practice</Link>
      </nav>
    </li>
  );
}

function resolutionLabel(item: MistakeItem) {
  if (item.resolutionSource === "review_independent_success") return "Resolved in Review";
  return "Resolved independently";
}

function mistakeCount(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function displayStageName(name: string) {
  return name === "Past Paper-style Questions" ? "Exam practice" : name;
}
