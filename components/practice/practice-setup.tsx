"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, Clock, SlidersHorizontal, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { createPracticeSessionSelection } from "@/lib/practice/practice-selection";
import { derivePracticeSetupVisibility, deriveVisiblePracticeModes } from "@/lib/practice/practice-setup";
import { upsertPracticeSession } from "@/lib/practice/practice-storage";
import type { PracticeMode, PracticeTiming } from "@/lib/practice/practice-types";
import { useHasMounted } from "@/lib/use-mounted";

const modeCopy: Record<Exclude<PracticeMode, "retry_incorrect">, { title: string; detail: string }> = {
  targeted: { title: "Path practice", detail: "Practise available questions from one path." },
  mixed: { title: "Mixed practice", detail: "Balance questions across multiple available paths." },
  needs_work: { title: "Needs Review", detail: "Revisit unfinished and review-recommended questions from your earlier work." },
};

export function PracticeSetup() {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const paths = useMemo(() => contentResolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable), []);
  const courses = [...new Map(paths.map((context) => [context.courseArea.slug, context.courseArea])).values()];
  const [mode, setMode] = useState<Exclude<PracticeMode, "retry_incorrect">>("targeted");
  const [courseId, setCourseId] = useState(courses[0]?.slug ?? "");
  const availablePaths = paths.filter((context) => context.courseArea.slug === courseId);
  const visibility = derivePracticeSetupVisibility(courses.length, availablePaths.length);
  const [selectedPathId, setSelectedPathId] = useState(availablePaths[0]?.skillPath.slug ?? "");
  const [questionCount, setQuestionCount] = useState(6);
  const [timed, setTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const selectedPathIds = mode === "mixed" ? availablePaths.map((context) => context.skillPath.slug) : selectedPathId ? [selectedPathId] : [];
  const needsWorkPreview = createPracticeSessionSelection({
    mode: "needs_work",
    courseId,
    selectedPathIds: selectedPathId ? [selectedPathId] : [],
    requestedCount: questionCount,
    seed: "practice-preview:needs-work",
    evidence,
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  const visibleModes = deriveVisiblePracticeModes({
    pathCount: availablePaths.length,
    hasNeedsWork: Boolean(needsWorkPreview.session),
  }) as Exclude<PracticeMode, "retry_incorrect">[];
  const preview = createPracticeSessionSelection({
    mode,
    courseId,
    selectedPathIds,
    requestedCount: questionCount,
    seed: `practice-preview:${mode}`,
    evidence,
    timing: timing(timed, timeLimitMinutes),
    now: new Date("2026-01-01T00:00:00.000Z"),
  });

  function startConfiguredSession() {
    const result = createPracticeSessionSelection({
      mode,
      courseId,
      selectedPathIds,
      requestedCount: questionCount,
      seed: `practice:${mode}:${courseId}:${selectedPathIds.join(",")}:${questionCount}`,
      evidence: getProgressEvidence(),
      timing: timing(timed, timeLimitMinutes),
    });
    if (!result.session) return;
    upsertPracticeSession(result.session);
    router.push(`/practice/session/${result.session.sessionId}`);
  }

  return (
    <AppShell demo active="Practice" className="py-8 max-xl:pt-5">
      <div className="mx-auto grid max-w-[920px] gap-5">
        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div>
            <p className="font-mono text-xs font-extrabold uppercase text-forge">Practice</p>
            <h1 className="m-0 mt-2 text-[34px] font-extrabold leading-none">Practise Basic differentiation</h1>
            <p className="mt-3 max-w-3xl text-muted">Start a useful short session now, or choose options when you want more control.</p>
          </div>
          <AppTopbar demo={false} />
        </header>

        <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl bg-forge-soft text-forge"><Target className="size-6" /></span>
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase text-forge">Recommended</p>
              <h2 className="m-0 text-xl font-extrabold">Quick Practice</h2>
              <p className="mt-1 text-sm text-muted">Six untimed questions selected deterministically from your most relevant available path.</p>
            </div>
            <QuickPracticeAction className="max-md:w-full" />
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
                      <span className="mt-1 block text-sm text-muted">{modeCopy[item].detail}</span>
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
              <button type="button" onClick={startConfiguredSession} disabled={!preview.session} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-4 font-extrabold text-white disabled:opacity-45 max-md:w-full">
                Start configured practice <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </details>

        <p className="text-sm text-muted">Opening Practice or choosing options does not record an attempt. Progress is recorded only after you submit an answer.</p>
        <Link href="/dashboard" className="text-sm font-bold text-forge">Back to dashboard</Link>
      </div>
    </AppShell>
  );
}

function timing(timed: boolean, minutes: number): PracticeTiming {
  return timed ? { type: "timed", timeLimitSeconds: Math.max(60, Math.min(10800, Math.floor(minutes * 60))), elapsedSeconds: 0 } : { type: "untimed" };
}
