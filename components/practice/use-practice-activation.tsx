"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticeActivationDialog } from "@/components/practice/practice-activation-dialog";
import {
  replaceActivePracticeSession,
  requestPracticeSessionActivation,
  resumeActivePracticeSession,
  type PracticeActivationConflict,
} from "@/lib/practice/practice-activation";
import type { PracticeSession } from "@/lib/practice/practice-types";

export function usePracticeActivation() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<PracticeSession | null>(null);
  const [conflict, setConflict] = useState<PracticeActivationConflict | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = useCallback((result: Awaited<ReturnType<typeof requestPracticeSessionActivation>>) => {
    if (result.status === "activated" || result.status === "resumed") {
      setCandidate(null);
      setConflict(null);
      router.push(`/practice/session/${result.session.sessionId}`);
      return true;
    }
    if (result.status === "conflict") {
      setConflict(result);
      return false;
    }
    setError(result.status === "coordination_unavailable"
      ? "This browser cannot safely coordinate practice across tabs."
      : "Practice could not be started safely. Please try again.");
    return false;
  }, [router]);

  const begin = useCallback(async (nextCandidate: PracticeSession) => {
    setCandidate(nextCandidate);
    setError(null);
    setBusy(true);
    const result = await requestPracticeSessionActivation(nextCandidate);
    handleResult(result);
    setBusy(false);
  }, [handleResult]);

  const replace = useCallback(async () => {
    if (!candidate || !conflict) return;
    setBusy(true);
    const result = await replaceActivePracticeSession(candidate, conflict.activeSession.sessionId);
    handleResult(result);
    setBusy(false);
  }, [candidate, conflict, handleResult]);

  const resume = useCallback(async () => {
    if (!conflict) return;
    setBusy(true);
    const result = await resumeActivePracticeSession(conflict.activeSession.sessionId);
    handleResult(result);
    setBusy(false);
  }, [conflict, handleResult]);

  const cancel = useCallback(() => {
    if (busy) return;
    setCandidate(null);
    setConflict(null);
    setError(null);
  }, [busy]);

  return {
    begin,
    busy,
    error,
    activationUi: conflict ? (
      <PracticeActivationDialog
        conflict={conflict}
        busy={busy}
        onResume={() => void resume()}
        onReplace={() => void replace()}
        onCancel={cancel}
      />
    ) : null,
  };
}
