"use client";

import { useEffect, useState } from "react";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { loadPracticeSessionStore } from "@/lib/practice/practice-storage";

export function useLearnerNextAction() {
  const [action, setAction] = useState(() => deriveLearnerNextAction({ evidence: getEmptyProgressEvidence() }));

  useEffect(() => {
    const update = () => {
      const sessions = loadPracticeSessionStore().store;
      const activePracticeSession = sessions.activeSessionId
        ? sessions.sessions.find((session) => session.sessionId === sessions.activeSessionId) ?? null
        : null;
      setAction(deriveLearnerNextAction({ evidence: getProgressEvidence(), activePracticeSession }));
    };
    update();
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

  return action;
}
