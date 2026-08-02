"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { LessonRenderer, type LessonTypography } from "@/components/learning/lesson-renderer";
import { SubjectResourceLinks } from "@/components/learning/subject-resource-links";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import { Card } from "@/components/ui";
import { getActiveSubject, getActiveSkillPath, getAllSkillPaths, getQuestionContext } from "@/lib/learning-paths";
import { resolveLessonDocument } from "@/lib/lessons/resolver";
import { WORKING_CONTEXT_NOTES_ORIGIN_PREFIX } from "@/lib/working-context";

export function HigherMathsResourceBrowser({
  returnTo: requestedReturnTo,
  questionOrigin,
  typography = "system_sans",
}: {
  returnTo?: string;
  questionOrigin?: {
    questionId?: string;
    questionNumber?: string;
    token?: string;
  };
  typography?: LessonTypography;
}) {
  const router = useRouter();
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const lesson = resolveLessonDocument(skillPath);
  const futurePaths = getAllSkillPaths(subject).filter((path) => !path.isAvailable);
  const returnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : null;
  const originQuestionId = questionOrigin?.questionId && /^[a-z0-9-]+$/i.test(questionOrigin.questionId)
    ? questionOrigin.questionId
    : null;
  const originQuestionNumber = Number.parseInt(questionOrigin?.questionNumber ?? "", 10);
  const originQuestionContext = originQuestionId ? getQuestionContext(originQuestionId) : null;
  const hasQuestionOrigin = Boolean(
    originQuestionId
    && originQuestionContext?.skillPath.slug === "basic-differentiation"
    && Number.isInteger(originQuestionNumber)
    && originQuestionNumber > 0
    && questionOrigin?.token,
  );

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
            notes: "/subjects/higher-maths/revision-notes",
            flashcards: "/subjects/higher-maths/flashcards",
            practice: `/practice?path=${encodeURIComponent(skillPath.slug)}`,
          }}
        />

        {lesson ? (
          <LessonRenderer document={lesson.document} typography={typography} />
        ) : (
          <Card className="p-6"><h1 className="text-2xl font-extrabold">Notes are being prepared</h1><p className="mt-2 text-muted">There is no published lesson for this path yet.</p></Card>
        )}

        <section aria-labelledby="notes-practice-title" className="max-w-[760px] border-t border-line pt-5">
          <h2 id="notes-practice-title" className="mb-3 text-lg font-extrabold">Practise this lesson</h2>
          <PracticeEntryCard preferredPathId={skillPath.slug} testId="notes-practice" />
        </section>

        {futurePaths.length ? (
          <details className="group rounded-xl border border-line bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted">
              <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4" />Future Higher Maths notes ({futurePaths.length} paths)</span>
              <ChevronDown aria-hidden="true" className="size-4 transition group-open:rotate-180" />
            </summary>
            <div className="grid gap-2 border-t border-line p-4">
              {futurePaths.map((path) => <div key={path.slug} className="flex justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm"><strong>{path.name}</strong><span className="text-muted">Coming soon</span></div>)}
            </div>
          </details>
        ) : null}
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
