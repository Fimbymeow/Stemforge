"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Clock, SlidersHorizontal, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { readConfidenceLocalState } from "@/lib/confidence/local-state";
import {
  QUICK_PRACTICE_DURATION_OPTIONS,
  type QuickPracticeDurationMinutes,
  type QuickPracticeReason,
} from "@/lib/practice/adaptive-practice";
import { createPracticeSessionSelection } from "@/lib/practice/practice-selection";
import { derivePracticeSetupVisibility, deriveVisiblePracticeModes } from "@/lib/practice/practice-setup";
import { MAX_PRACTICE_QUESTIONS, type PracticeMode, type PracticeTiming } from "@/lib/practice/practice-types";
import { useHasMounted } from "@/lib/use-mounted";
import { createReviewSessionSelection } from "@/lib/review/selection";
import { readStudyPlanLocalState } from "@/lib/study-plan/local-state";
import { createQuickPracticeSelection } from "@/lib/study-context";

type ConfigurablePracticeMode = Exclude<PracticeMode, "review">;

const modeCopy: Record<ConfigurablePracticeMode, { title: string; detail: string }> = {
  targeted: { title: "Path practice", detail: "Practise available questions from one path." },
  mixed: { title: "Mixed practice", detail: "Balance questions across multiple available paths." },
  needs_work: { title: "Needs more practice", detail: "Revisit unfinished questions and questions that would benefit from another attempt." },
  retry_incorrect: { title: "Retry mistakes", detail: "Practise unresolved questions you previously got wrong." },
};

export function PracticeSetup({
  workingContextPathId,
  invalidWorkingContextPath = false,
  reviewMode = false,
}: {
  workingContextPathId?: string | null;
  invalidWorkingContextPath?: boolean;
  reviewMode?: boolean;
}) {
  const activation = usePracticeActivation();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const paths = useMemo(() => contentResolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable), []);
  const workingContextPath = paths.find((context) => context.skillPath.slug === workingContextPathId);
  const courses = [...new Map(paths.map((context) => [context.courseArea.slug, context.courseArea])).values()];
  const [mode, setMode] = useState<ConfigurablePracticeMode>("targeted");
  const [courseId, setCourseId] = useState(courses[0]?.slug ?? "");
  const availablePaths = paths.filter((context) => context.courseArea.slug === courseId);
  const hasWorkingContextPrefill = availablePaths.some((item) => item.skillPath.slug === workingContextPathId);
  const sessionOrigin = hasWorkingContextPrefill ? "working_context_practice" : "configured_practice";
  const visibility = derivePracticeSetupVisibility(courses.length, availablePaths.length);
  const [selectedPathId, setSelectedPathId] = useState(
    availablePaths.some((item) => item.skillPath.slug === workingContextPathId)
      ? workingContextPathId!
      : availablePaths[0]?.skillPath.slug ?? "",
  );
  const [questionCount, setQuestionCount] = useState(6);
  const [timed, setTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [quickDuration, setQuickDuration] = useState<QuickPracticeDurationMinutes>(20);
  const selectedPathIds = mode === "mixed" ? availablePaths.map((context) => context.skillPath.slug) : selectedPathId ? [selectedPathId] : [];
  const needsWorkPreview = createPracticeSessionSelection({
    origin: sessionOrigin,
    mode: "needs_work",
    courseId,
    selectedPathIds: selectedPathId ? [selectedPathId] : [],
    requestedCount: questionCount,
    seed: "practice-preview:needs-work",
    evidence,
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  const retryIncorrectPreview = createPracticeSessionSelection({
    origin: "retry_incorrect",
    mode: "retry_incorrect",
    courseId,
    selectedPathIds: selectedPathId ? [selectedPathId] : [],
    requestedCount: MAX_PRACTICE_QUESTIONS,
    seed: "practice-preview:retry-incorrect",
    evidence,
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  const visibleModes = deriveVisiblePracticeModes({
    pathCount: availablePaths.length,
    hasNeedsWork: Boolean(needsWorkPreview.session),
    hasRetryIncorrect: Boolean(retryIncorrectPreview.session),
  });
  const retryIncorrectCount = retryIncorrectPreview.eligibleQuestions.length;
  useEffect(() => {
    if (!visibleModes.includes(mode)) setMode("targeted");
  }, [mode, visibleModes]);
  const configuredTiming = mode === "targeted" || mode === "mixed"
    ? timing(timed, timeLimitMinutes)
    : { type: "untimed" as const };
  const preview = createPracticeSessionSelection({
    origin: mode === "retry_incorrect" ? "retry_incorrect" : sessionOrigin,
    mode,
    courseId,
    selectedPathIds,
    requestedCount: questionCount,
    seed: `practice-preview:${mode}`,
    evidence,
    timing: configuredTiming,
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  const reviewPreview = createReviewSessionSelection({
    evidence,
    targetPathId: workingContextPathId ?? undefined,
  });
  const localStudyPlan = hasMounted ? readStudyPlanLocalState(window.localStorage) : null;
  const localConfidence = hasMounted ? readConfidenceLocalState(window.localStorage) : null;
  const quickPreview = createQuickPracticeSelection({
    evidence,
    preferredPathId: workingContextPathId,
    durationMinutes: quickDuration,
    assessments: localStudyPlan?.setup?.assessments ?? [],
    learnerConfidence: new Map(Object.values(localConfidence?.ratings ?? {}).map((rating) => [rating.skillPathId, rating.level])),
  });

  function startConfiguredSession() {
    const result = createPracticeSessionSelection({
      origin: mode === "retry_incorrect" ? "retry_incorrect" : sessionOrigin,
      mode,
      courseId,
      selectedPathIds,
      requestedCount: questionCount,
      seed: `practice:${mode}:${courseId}:${selectedPathIds.join(",")}:${questionCount}`,
      evidence: getProgressEvidence(),
      timing: configuredTiming,
    });
    if (!result.session) return;
    void activation.begin(result.session);
  }

  function startReviewSession() {
    const result = createReviewSessionSelection({
      evidence: getProgressEvidence(),
      targetPathId: workingContextPathId ?? undefined,
    });
    if (result.session) void activation.begin(result.session);
  }

  if (invalidWorkingContextPath) {
    return (
      <AppShell demo active="Practice" className="py-8 max-xl:pt-5">
        <Card className="mx-auto max-w-[760px] p-6">
          <h1 className="text-2xl font-extrabold">Practice path unavailable</h1>
          <p className="mt-2 text-muted">That topic isn&apos;t available for practice yet. Choose from the topics available now instead.</p>
          <Link href="/practice" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-extrabold text-white">Browse available practice</Link>
        </Card>
      </AppShell>
    );
  }

  if (reviewMode) {
    const dueCount = reviewPreview.dueStates.filter((state) => state.due).length;
    const reason = reviewPreview.dueStates.find((state) => state.due)?.reason;
    return (
      <AppShell demo active="Practice" className="py-8 max-xl:pt-5" workingContextPathId={workingContextPathId}>
        <div className="mx-auto grid max-w-[760px] gap-5">
          <nav aria-label="Review navigation" className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
            <Link href="/subjects/higher-maths" className="inline-flex min-h-10 items-center gap-2 text-forge"><ArrowLeft aria-hidden="true" className="size-4" />Back to Higher Maths</Link>
            <Link href="/dashboard" className="inline-flex min-h-10 items-center text-muted hover:text-forge">Dashboard</Link>
            <Link href={workingContextPathId ? `/practice?path=${encodeURIComponent(workingContextPathId)}` : "/practice"} className="inline-flex min-h-10 items-center text-muted hover:text-forge">Practice</Link>
          </nav>
          <header>
            <p className="text-sm font-bold text-muted">Review</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight">Review what is due</h1>
            <p className="mt-3 text-muted">A short Review uses the same practice screen you already know.</p>
          </header>
          <Card className="border-forge/30 bg-white p-5" data-testid="review-launch-card">
            {reviewPreview.session ? (
              <>
                <p className="text-sm font-extrabold text-forge">{dueCount} skill{dueCount === 1 ? "" : "s"} due</p>
                <h2 className="mt-1 text-xl font-extrabold">
                  {reviewPreview.session.questionReferences.length} question{reviewPreview.session.questionReferences.length === 1 ? "" : "s"} ready
                </h2>
                <p className="mt-2 text-sm text-muted">{reviewReasonCopy(reason)}</p>
                {reviewPreview.remainingDueCount > 0 ? (
                  <p className="mt-2 text-sm font-bold text-muted">{reviewPreview.remainingDueCount} more due skill{reviewPreview.remainingDueCount === 1 ? "" : "s"} will remain for the next Review.</p>
                ) : null}
                <button type="button" onClick={startReviewSession} disabled={activation.busy} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white max-sm:w-full">
                  Start Review <ArrowRight className="size-5" />
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold">Nothing is due right now</h2>
                <p className="mt-2 text-muted">Keep learning or practising. Review will appear here when a completed skill is ready to revisit.</p>
              </>
            )}
            {activation.error ? <p role="alert" className="mt-3 text-sm font-bold text-danger">{activation.error}</p> : null}
          </Card>
        </div>
        {activation.activationUi}
      </AppShell>
    );
  }

  return (
    <AppShell demo active="Practice" className="py-8 max-xl:pt-5" workingContextPathId={workingContextPathId}>
      <div className="mx-auto grid max-w-[920px] gap-5">
        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div>
            <p className="text-sm font-bold text-muted">Practice</p>
            <h1 className="m-0 mt-1 text-[28px] font-extrabold leading-tight">Practise {workingContextPath?.skillPath.name ?? "Higher Maths"}</h1>
            <p className="mt-3 max-w-3xl text-muted">Start a useful short session now, or choose options when you want more control.</p>
          </div>
          <AppTopbar demo={false} />
        </header>

        <Card className="border-forge/30 bg-white p-5" data-testid="practice-quick-card">
          <div className="grid grid-cols-[auto_1fr] items-start gap-4 max-md:grid-cols-[auto_1fr]">
            <span className="grid size-10 place-items-center rounded-lg bg-forge-soft text-forge"><Target className="size-5" /></span>
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase text-forge">Recommended</p>
              <h2 className="m-0 text-xl font-extrabold">Quick Practice</h2>
              {quickPreview.recommendation ? (
                <p className="mt-1 text-sm text-muted" data-testid="quick-practice-recommendation">
                  <strong className="text-ink">{quickPreview.recommendation.primarySkillName}</strong>
                  {" — "}{quickReasonCopy(quickPreview.recommendation.reasons, quickPreview.recommendation.assessment?.title)}.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">Orthic will choose a useful set from the practice available now.</p>
              )}
            </div>
          </div>

          {quickPreview.reviewOffer ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3" data-testid="quick-practice-review-advisory">
              <p className="text-sm text-muted">
                <strong className="text-ink">Review due: {quickPreview.reviewOffer.skillName}</strong>
                <span className="ml-1">Scheduled Review stays separate from this practice.</span>
              </p>
              <Link href={quickPreview.reviewOffer.href} className="inline-flex min-h-10 items-center font-extrabold text-forge">Start Review</Link>
            </div>
          ) : null}

          <div className="mt-5 flex items-end justify-between gap-4 max-md:grid">
            <fieldset>
              <legend className="mb-2 text-sm font-extrabold">Choose a session length</legend>
              <div className="inline-flex rounded-lg border border-line bg-paper p-1" data-testid="quick-practice-duration-options">
                {QUICK_PRACTICE_DURATION_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={quickDuration === minutes}
                    onClick={() => setQuickDuration(minutes)}
                    className={`min-h-10 rounded-md px-3 text-sm font-extrabold ${quickDuration === minutes ? "bg-white text-forge shadow-sm" : "text-muted"}`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                About {quickPreview.recommendation?.requestedCount ?? 0} question{quickPreview.recommendation?.requestedCount === 1 ? "" : "s"}; fewer if suitable content is limited.
              </p>
            </fieldset>
            <QuickPracticeAction
              className="max-md:w-full"
              preferredPathId={workingContextPathId}
              durationMinutes={quickDuration}
              preview={quickPreview}
            />
          </div>
        </Card>

        <details className="group rounded-xl border border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-extrabold">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-5 text-forge" />Choose practice options</span>
            <ChevronDown className="size-5 text-muted transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-line p-5">
            {visibleModes.length > 1 ? (
              <fieldset className="grid gap-3">
                <legend className="mb-2 font-extrabold">Practice type</legend>
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  {visibleModes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={mode === item}
                      onClick={() => setMode(item)}
                      className={`rounded-xl border p-4 text-left ${mode === item ? "border-forge bg-forge-soft" : "border-line bg-white"}`}
                    >
                      <strong>{modeCopy[item].title}</strong>
                      <span className="mt-1 block text-sm text-muted">
                        {item === "retry_incorrect"
                          ? `${mistakeCount(retryIncorrectCount)}. ${modeCopy[item].detail}`
                          : modeCopy[item].detail}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="rounded-xl bg-paper p-3 text-sm text-muted">Path practice is the useful configurable option for the content available today.</p>
            )}

            {visibility.showCourseChoice ? <label className="grid gap-2">
              <span className="font-bold">Course</span>
              <select value={courseId} onChange={(event) => {
                const nextCourseId = event.target.value;
                const nextPaths = paths.filter((context) => context.courseArea.slug === nextCourseId);
                setCourseId(nextCourseId);
                setSelectedPathId(nextPaths[0]?.skillPath.slug ?? "");
                if (mode === "mixed" && nextPaths.length < 2) setMode("targeted");
              }} className="min-h-11 rounded-lg border border-line bg-white px-3">
                {courses.map((course) => <option key={course.slug} value={course.slug}>{course.name}</option>)}
              </select>
            </label> : null}

            {mode !== "mixed" && visibility.showPathChoice ? (
              <label className="grid gap-2">
                <span className="font-bold">Path</span>
                <select value={selectedPathId} onChange={(event) => setSelectedPathId(event.target.value)} className="min-h-11 rounded-lg border border-line bg-white px-3">
                  {availablePaths.map((context) => <option key={context.skillPath.slug} value={context.skillPath.slug}>{context.skillPath.name}</option>)}
                </select>
              </label>
            ) : null}

            <details className="group/advanced rounded-xl border border-line bg-paper">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-bold">
                Advanced options
                <ChevronDown className="size-4 transition group-open/advanced:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-line p-4">
                <label className="grid gap-2">
                  <span className="font-bold">Number of questions</span>
                  <input aria-label="Requested questions" type="number" min={1} max={30} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="min-h-11 rounded-lg border border-line bg-white px-3" />
                </label>
                {(mode === "targeted" || mode === "mixed") ? (
                  <fieldset className="grid gap-2 rounded-xl border border-line bg-white p-3">
                    <legend className="px-1 font-bold">Timing</legend>
                    <label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={timed} onChange={(event) => setTimed(event.target.checked)} /> Timed session</label>
                    {timed ? <input aria-label="Time limit minutes" type="number" min={1} max={180} value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(Number(event.target.value))} className="min-h-11 rounded-lg border border-line bg-white px-3" /> : null}
                  </fieldset>
                ) : null}
              </div>
            </details>

            <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-line bg-paper p-4 max-md:grid-cols-1">
              <div>
                <h2 className="m-0 text-lg font-extrabold">Session preview</h2>
                <p className="mt-1 text-sm text-muted">{preview.shortageReason ?? `${preview.session?.questionReferences.length ?? 0} question${preview.session?.questionReferences.length === 1 ? "" : "s"} selected from available content.`}</p>
              </div>
              <button type="button" onClick={startConfiguredSession} disabled={!preview.session || activation.busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-4 font-extrabold text-white disabled:opacity-45 max-md:w-full">
                {mode === "retry_incorrect" ? "Start mistake practice" : "Start configured practice"} <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </details>

        <p className="text-sm text-muted">Opening Practice or choosing options does not record an attempt. Progress is recorded only after you submit an answer.</p>
        {activation.error ? <p role="status" className="text-sm text-red-700">{activation.error}</p> : null}
        <Link href="/dashboard" className="text-sm font-bold text-forge">Back to dashboard</Link>
      </div>
      {activation.activationUi}
    </AppShell>
  );
}

function quickReasonCopy(reasons: readonly QuickPracticeReason[], assessmentTitle?: string) {
  return reasons.map((reason) => {
    if (reason === "open_mistake") return "recent mistake";
    if (reason === "on_your_test") return assessmentTitle ? `on ${assessmentTitle}` : "on your upcoming test";
    if (reason === "you_marked_needs_work") return "you marked this as Needs work";
    return "the clearest next step in your learning";
  }).join(" · ");
}

function timing(timed: boolean, minutes: number): PracticeTiming {
  return timed ? { type: "timed", timeLimitSeconds: Math.max(60, Math.min(10800, Math.floor(minutes * 60))), elapsedSeconds: 0 } : { type: "untimed" };
}

function mistakeCount(count: number) {
  return `${count} unresolved mistake${count === 1 ? "" : "s"}`;
}

function reviewReasonCopy(reason: ReturnType<typeof createReviewSessionSelection>["dueStates"][number]["reason"] | undefined) {
  if (reason === "recently_incorrect") return "This Review is due because of a recent incorrect answer.";
  if (reason === "content_changed") return "This topic was updated since you last practised it, so it's worth another look.";
  return "This skill is due after time away from it.";
}
