"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import { loadPracticeSessionStore, upsertPracticeSession } from "@/lib/practice/practice-storage";
import { createQuickPracticeSelection } from "@/lib/study-context";
import { useHasMounted } from "@/lib/use-mounted";

export function QuickPracticeAction({
  preferredPathId,
  className = "",
  label = "Start Quick Practice",
  testId = "quick-practice-action",
  describedBy,
}: {
  preferredPathId?: string | null;
  className?: string;
  label?: string;
  testId?: string;
  describedBy?: string;
}) {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const activeSession = hasMounted ? getActiveSession() : null;
  const nextAction = deriveLearnerNextAction({ evidence, activePracticeSession: activeSession });
  const quick = useMemo(
    () => createQuickPracticeSelection({ evidence, preferredPathId: preferredPathId ?? nextAction.pathId }),
    [evidence, nextAction.pathId, preferredPathId],
  );
  const resume = nextAction.kind === "resume_practice" && nextAction.href ? nextAction : null;

  function begin() {
    if (resume?.href) {
      router.push(resume.href);
      return;
    }
    const selection = createQuickPracticeSelection({
      evidence: getProgressEvidence(),
      preferredPathId: preferredPathId ?? nextAction.pathId,
    });
    if (!selection.result.session) return;
    upsertPracticeSession(selection.result.session);
    router.push(`/practice/session/${selection.result.session.sessionId}`);
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-describedby={describedBy}
      onClick={begin}
      disabled={!hasMounted || (!resume && !quick.result.session)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white disabled:opacity-45 ${className}`}
    >
      {resume ? "Resume Practice" : label}
      <ArrowRight className="size-5" />
    </button>
  );
}

function getActiveSession() {
  const store = loadPracticeSessionStore().store;
  return store.activeSessionId
    ? store.sessions.find((session) => session.sessionId === store.activeSessionId) ?? null
    : null;
}
