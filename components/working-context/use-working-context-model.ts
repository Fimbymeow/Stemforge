"use client";

import { useEffect, useMemo, useState } from "react";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { loadPracticeSessionStore } from "@/lib/practice/practice-storage";
import { deriveWorkingContextModel } from "@/lib/working-context";

export function useWorkingContextModel(pathId: string) {
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setMounted(true);
    const update = () => setVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:practice-session-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:practice-session-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return useMemo(() => {
    void version;
    const sessions = mounted ? loadPracticeSessionStore().store : null;
    const activePracticeSession = sessions?.activeSessionId
      ? sessions.sessions.find((session) => session.sessionId === sessions.activeSessionId) ?? null
      : null;
    return deriveWorkingContextModel({
      pathId,
      evidence: mounted ? getProgressEvidence() : getEmptyProgressEvidence(),
      activePracticeSession,
    });
  }, [mounted, pathId, version]);
}
