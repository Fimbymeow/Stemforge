"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Dumbbell, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
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
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1040px] justify-end"><AppTopbar demo /></div>
      <main className="mx-auto grid max-w-[1040px] gap-7" data-testid="mistake-log">
        <header className="grid gap-4">
          <Link href="/subjects/higher-maths" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg text-sm font-extrabold text-forge">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1">
            <PageHeaderIconChip><BookOpen aria-hidden="true" className="size-5" /></PageHeaderIconChip>
            <div>
              <Eyebrow className="text-forge">Higher Maths</Eyebrow>
              <h1 className="mt-1 text-[32px] font-extrabold leading-tight">Mistake Log</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">A quiet record of questions to revisit, grouped by skill. Items clear automatically after later independent success.</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="open-mistakes-heading" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 id="open-mistakes-heading" className="text-xl font-extrabold">To revisit</h2>
              <p className="mt-1 text-sm text-muted">Only unresolved mistakes from current question versions appear here.</p>
            </div>
            {model.openCount > 0 ? <p className="text-sm font-extrabold text-forge">{mistakeCount(model.openCount, "unresolved mistake")}</p> : null}
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
            <div className="rounded-xl border border-line bg-white px-5 py-7" data-testid="mistake-log-empty-state">
              <h3 className="font-extrabold">No unresolved mistakes right now.</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">When a genuine graded attempt is incorrect, the question will appear here automatically.</p>
            </div>
          )}
        </section>

        {historyCount > 0 ? (
          <details className="disclosure-motion border-y border-line" data-testid="mistake-history-disclosure">
            <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-3 font-extrabold">
              <CheckCircle2 aria-hidden="true" className="size-5 text-forge" /> Show resolved and previous-version history ({historyCount})
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id={headingId} className="text-lg font-extrabold">{group.skillName}</h3>
          <p className="mt-1 text-sm font-semibold text-muted">{mistakeCount(group.items.length, history ? "history item" : "unresolved question")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!history ? (
            <Link
              href={`/subjects/higher-maths/question-bank?path=${encodeURIComponent(group.skillPathId)}&status=previously-incorrect`}
              aria-label={`Practise these ${group.skillName} questions`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-forge px-4 text-sm font-extrabold text-forge"
            >
              <Dumbbell aria-hidden="true" className="size-4" /> Practise these
            </Link>
          ) : null}
          {group.officialRequirementCount > 0 ? (
            <Link href="/subjects/higher-maths/course-tracker" className="min-h-10 py-2 text-sm font-bold text-muted underline-offset-4 hover:text-forge hover:underline">
              View official requirements ({group.officialRequirementCount})
            </Link>
          ) : null}
        </div>
      </div>
      <ul className="mt-3 divide-y divide-line border-y border-line bg-white" aria-label={`${group.skillName} ${history ? "mistake history" : "unresolved mistakes"}`}>
        {group.items.map((item) => <MistakeRow key={item.groupId} item={item} />)}
      </ul>
    </section>
  );
}

function MistakeRow({ item }: { item: MistakeItem }) {
  const stateLabel = item.state === "open"
    ? "Unresolved"
    : item.state === "historical"
      ? item.resolvedAt ? `Previous version · ${resolutionLabel(item)}` : "Previous version"
      : resolutionLabel(item);
  return (
    <li className="grid gap-4 px-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-3" data-testid="mistake-item" data-mistake-state={item.state} data-question-id={item.questionId} data-question-version={item.questionVersion}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="font-extrabold">Question {item.questionNumber}: {item.questionTitle}</h4>
          <StatusPill variant={item.state === "open" ? "warning" : "neutral"}>{stateLabel}</StatusPill>
        </div>
        <p className="mt-2 text-sm font-semibold text-muted">
          {displayStageName(item.stageName)} · {mistakeCount(item.incorrectAttemptCount, "incorrect attempt")}
          {item.resolvedAt
            ? <> before resolving · Resolved <time dateTime={item.resolvedAt}>{formatDate(item.resolvedAt)}</time></>
            : <> · Last attempted <time dateTime={item.latestIncorrectAt}>{formatDate(item.latestIncorrectAt)}</time></>}
        </p>
        {item.wasReopened && item.state === "open" ? <p className="mt-1 text-xs font-semibold text-muted">Reopened after a later incorrect attempt.</p> : null}
        {item.representedInReviewRecovery ? <p className="mt-1 text-xs font-semibold text-forge">Also represented in current Review recovery.</p> : null}
      </div>
      <nav aria-label={`Actions for ${item.skillName} question ${item.questionNumber}`} className="flex flex-wrap items-center gap-2 sm:justify-end">
        {item.state === "open" ? (
          <Link href={item.retryHref} aria-label={`Retry ${item.skillName} question ${item.questionNumber}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-4 text-sm font-extrabold text-white">
            <RotateCcw aria-hidden="true" className="size-4" /> Retry
          </Link>
        ) : null}
        {item.notesHref ? <Link href={item.notesHref} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-ink hover:bg-forge-soft">Notes</Link> : null}
        <Link href={item.practiceHref} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-ink hover:bg-forge-soft">More practice</Link>
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
