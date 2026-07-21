"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, RotateCcw, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";
import { createPracticeSessionSelection } from "@/lib/practice/practice-selection";
import { derivePracticeSetupVisibility } from "@/lib/practice/practice-setup";
import { upsertPracticeSession } from "@/lib/practice/practice-storage";
import type { PracticeMode, PracticeTiming } from "@/lib/practice/practice-types";

const modeCopy: Record<PracticeMode, { title: string; detail: string }> = {
  targeted: { title: "Targeted practice", detail: "Focus on one available path." },
  mixed: { title: "Mixed practice from available content", detail: "Balance questions across selected available paths." },
  needs_work: { title: "Needs-work practice", detail: "Uses existing review and completion evidence. No diagnosis from zero evidence." },
  retry_incorrect: { title: "Retry incorrect", detail: "Uses your latest current-version genuine attempts." },
};

export function PracticeSetup() {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const paths = useMemo(() => contentResolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable), []);
  const courses = [...new Map(paths.map((context) => [context.courseArea.slug, context.courseArea])).values()];
  const [mode, setMode] = useState<PracticeMode>("targeted");
  const [courseId, setCourseId] = useState(courses[0]?.slug ?? "");
  const availablePaths = paths.filter((context) => context.courseArea.slug === courseId);
  const visibility = derivePracticeSetupVisibility(courses.length, availablePaths.length);
  const [selectedPathId, setSelectedPathId] = useState(availablePaths[0]?.skillPath.slug ?? "");
  const [questionCount, setQuestionCount] = useState(6);
  const [timed, setTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const selectedPathIds = mode === "mixed" ? availablePaths.map((context) => context.skillPath.slug) : selectedPathId ? [selectedPathId] : [];
  const preview = createPracticeSessionSelection({
    mode,
    courseId,
    selectedPathIds,
    requestedCount: questionCount,
    seed: "practice-preview",
    evidence,
    timing: timing(timed, timeLimitMinutes),
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  const visibleModes = (Object.keys(modeCopy) as PracticeMode[]).filter((item) => item !== "mixed" || visibility.showMixedMode);

  function previewForMode(candidateMode: PracticeMode) {
    const candidatePathIds = candidateMode === "mixed" ? availablePaths.map((context) => context.skillPath.slug) : selectedPathId ? [selectedPathId] : [];
    return createPracticeSessionSelection({
      mode: candidateMode,
      courseId,
      selectedPathIds: candidatePathIds,
      requestedCount: questionCount,
      seed: `practice-preview:${candidateMode}`,
      evidence,
      timing: timing(timed, timeLimitMinutes),
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
  }

  function startSession() {
    const result = createPracticeSessionSelection({
      mode,
      courseId,
      selectedPathIds,
      requestedCount: questionCount,
      seed: `practice:${mode}:${courseId}:${selectedPathIds.join(",")}:${questionCount}`,
      evidence,
      timing: timing(timed, timeLimitMinutes),
    });
    if (!result.session) return;
    upsertPracticeSession(result.session);
    router.push(`/practice/session/${result.session.sessionId}`);
  }

  return (
    <AppShell demo active="Practice" className="py-8 max-xl:pt-5">
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div>
            <p className="font-mono text-xs font-extrabold uppercase text-forge">Revision and assessment</p>
            <h1 className="m-0 mt-2 text-[34px] font-extrabold leading-none">Practice sessions</h1>
            <p className="mt-3 max-w-3xl text-muted">Build a short session from currently available canonical questions. More content appears automatically as it is registered.</p>
          </div>
          <AppTopbar demo={false} />
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
          <section className="grid gap-4">
            <Card className="p-4">
              <h2 className="mb-3 text-xl font-extrabold">Choose a mode</h2>
              <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                {visibleModes.map((item) => {
                  const candidatePreview = previewForMode(item);
                  const unavailable = (item === "needs_work" || item === "retry_incorrect") && !candidatePreview.session;
                  return (
                    <button key={item} type="button" disabled={unavailable} onClick={() => setMode(item)} className={`rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-55 ${mode === item ? "border-forge bg-forge-soft" : "border-line bg-white"}`}>
                      <strong>{modeCopy[item].title}</strong>
                      <span className="mt-1 block text-sm text-muted">{unavailable ? candidatePreview.shortageReason : modeCopy[item].detail}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="grid gap-4 p-4">
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
              ) : mode === "mixed" ? (
                <div className="rounded-xl border border-line bg-paper p-3 text-sm text-muted">Mixed practice will use {availablePaths.length} available path{availablePaths.length === 1 ? "" : "s"} in this course.</div>
              ) : null}
              <label className="grid gap-2">
                <span className="font-bold">Requested questions</span>
                <input aria-label="Requested questions" type="number" min={1} max={30} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="min-h-11 rounded-lg border border-line bg-white px-3" />
              </label>
              {(mode === "targeted" || mode === "mixed") ? (
                <fieldset className="grid gap-2 rounded-xl border border-line p-3">
                  <legend className="px-1 font-bold">Timing</legend>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={timed} onChange={(event) => setTimed(event.target.checked)} /> Timed session</label>
                  {timed ? <input aria-label="Time limit minutes" type="number" min={1} max={180} value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(Number(event.target.value))} className="min-h-11 rounded-lg border border-line bg-white px-3" /> : null}
                </fieldset>
              ) : null}
            </Card>
          </section>

          <aside className="grid content-start gap-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                {mode === "retry_incorrect" ? <RotateCcw className="size-5 text-forge" /> : mode === "mixed" ? <Clock className="size-5 text-forge" /> : <Target className="size-5 text-forge" />}
                <h2 className="m-0 text-lg font-extrabold">Session preview</h2>
              </div>
              <p className="text-sm text-muted">{preview.shortageReason ?? `${preview.session?.questionReferences.length ?? 0} questions selected from available content.`}</p>
              <p className="mt-3 text-sm font-bold">{preview.eligibleQuestions.length} eligible question{preview.eligibleQuestions.length === 1 ? "" : "s"} found.</p>
              <button type="button" onClick={startSession} disabled={!preview.session} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forge px-4 font-extrabold text-white disabled:opacity-45">
                Start session <ArrowRight className="size-5" />
              </button>
            </Card>
            <Card className="p-4 text-sm text-muted">
              Session state stays on this browser. Submitted answers remain normal progress evidence and can sync when account sync is enabled.
            </Card>
            <Link href="/dashboard" className="text-sm font-bold text-forge">Back to dashboard</Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function timing(timed: boolean, minutes: number): PracticeTiming {
  return timed ? { type: "timed", timeLimitSeconds: Math.max(60, Math.min(10800, Math.floor(minutes * 60))), elapsedSeconds: 0 } : { type: "untimed" };
}
