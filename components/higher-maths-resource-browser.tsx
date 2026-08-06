"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { LessonRenderer, type LessonTypography } from "@/components/learning/lesson-renderer";
import { SubjectResourceLinks } from "@/components/learning/subject-resource-links";
import { Card } from "@/components/ui";
import { getActiveSkillPath, getQuestionContext, getSkillPathById } from "@/lib/learning-paths";
import { resolveLessonDocument } from "@/lib/lessons/resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveLessonContinuationAction, parseWorkingContextPathId, WORKING_CONTEXT_NOTES_ORIGIN_PREFIX } from "@/lib/working-context";

export function HigherMathsResourceBrowser({
  returnTo: requestedReturnTo,
  pathId,
  questionOrigin,
  typography = "system_sans",
}: {
  returnTo?: string;
  pathId?: string;
  questionOrigin?: {
    questionId?: string;
    questionNumber?: string;
    token?: string;
  };
  typography?: LessonTypography;
}) {
  const router = useRouter();
  // No `path` in the URL preserves the historical default (the active beta skill). An explicit
  // `path` must resolve to a genuinely available skill via the same resolver Practice already
  // uses (parseWorkingContextPathId) — an unavailable or unknown slug must never silently fall
  // back to a different skill's real Notes.
  const requestedSkillPathId = pathId ? parseWorkingContextPathId(pathId) : null;
  const skillPath = pathId ? (requestedSkillPathId ? getSkillPathById(requestedSkillPathId) : undefined) : getActiveSkillPath();
  const lesson = skillPath ? resolveLessonDocument(skillPath) : null;
  const [continuation, setContinuation] = useState(() => skillPath ? deriveLessonContinuationAction({
    pathId: skillPath.slug,
    evidence: getEmptyProgressEvidence(),
  }) : null);
  const returnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : null;
  const originQuestionId = questionOrigin?.questionId && /^[a-z0-9-]+$/i.test(questionOrigin.questionId)
    ? questionOrigin.questionId
    : null;
  const originQuestionNumber = Number.parseInt(questionOrigin?.questionNumber ?? "", 10);
  const originQuestionContext = originQuestionId ? getQuestionContext(originQuestionId) : null;
  const hasQuestionOrigin = Boolean(
    originQuestionId
    && skillPath
    && originQuestionContext?.skillPath.slug === skillPath.slug
    && Number.isInteger(originQuestionNumber)
    && originQuestionNumber > 0
    && questionOrigin?.token,
  );

  useEffect(() => {
    if (!skillPath) return;
    const update = () => setContinuation(deriveLessonContinuationAction({
      pathId: skillPath.slug,
      evidence: getProgressEvidence(),
    }));
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [skillPath]);

  if (!skillPath) {
    return (
      <AppShell demo active="Subjects">
        <div className="mx-auto mb-3 flex max-w-[1180px] justify-end"><AppTopbar demo /></div>
        <div className="mx-auto grid max-w-[1180px] gap-5">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects/higher-maths">Higher Maths</Link>
            <ArrowRight aria-hidden="true" className="size-4" />
            <span className="font-bold text-forge">Notes</span>
          </nav>
          <Card className="p-6"><h1 className="text-2xl font-extrabold">Notes are being prepared</h1><p className="mt-2 text-muted">There is no published lesson for this path yet.</p></Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell demo active="Subjects" workingContextPathId={skillPath.slug}>
      <div className="mx-auto mb-3 flex max-w-[1180px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[1180px] gap-5">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/subjects/higher-maths">Higher Maths</Link>
          <ArrowRight aria-hidden="true" className="size-4" />
          <span className="font-bold text-forge">Notes</span>
        </nav>

        {returnTo ? (
          <Link href={returnTo} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 font-extrabold text-forge">
            <ArrowLeft aria-hidden="true" className="size-4" />Return to active practice
          </Link>
        ) : null}
        {!returnTo && hasQuestionOrigin ? (
          <button
            type="button"
            onClick={returnToOriginQuestion}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 font-extrabold text-forge"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />Back to Question {originQuestionNumber}
          </button>
        ) : null}

        <SubjectResourceLinks
          family="mathematics"
          current="notes"
          hrefs={{
            notes: `/subjects/higher-maths/revision-notes?path=${encodeURIComponent(skillPath.slug)}`,
            flashcards: "/subjects/higher-maths/flashcards",
            practice: `/practice?path=${encodeURIComponent(skillPath.slug)}`,
          }}
        />

        {lesson ? (
          <LessonRenderer document={lesson.document} typography={typography} continuation={continuation ?? undefined} />
        ) : (
          <Card className="p-6"><h1 className="text-2xl font-extrabold">Notes are being prepared</h1><p className="mt-2 text-muted">There is no published lesson for this path yet.</p></Card>
        )}

      </div>
    </AppShell>
  );

  function returnToOriginQuestion() {
    if (!originQuestionId || !questionOrigin?.token) return;
    const explicitHref = `/question/${originQuestionId}`;
    const marker = readNotesOriginMarker(questionOrigin.token);
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const safePreviousEntry = navigation?.type !== "reload"
      && marker?.originHref === explicitHref
      && window.history.length === marker.historyLength + 1;
    if (safePreviousEntry) router.back();
    else router.push(explicitHref);
  }
}

function readNotesOriginMarker(token: string) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(`${WORKING_CONTEXT_NOTES_ORIGIN_PREFIX}${token}`) ?? "null") as {
      originHref?: unknown;
      historyLength?: unknown;
    } | null;
    return parsed && typeof parsed.originHref === "string" && typeof parsed.historyLength === "number"
      ? { originHref: parsed.originHref, historyLength: parsed.historyLength }
      : null;
  } catch {
    return null;
  }
}
