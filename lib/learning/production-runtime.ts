import * as progress from "@/lib/local-progress";
import * as drafts from "@/lib/questions/answer-drafts";
import { recordPathCelebrated, recordStageCelebrated } from "@/lib/completion-tracking";
import { getQuestionHref } from "@/lib/learning-paths";
import type { LearningRuntime } from "@/lib/learning/runtime";

function storage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

/** Delegates to existing production I/O; merely importing this adapter performs no reads. */
export const productionLearningRuntime: LearningRuntime = {
  kind: "production",
  getEvidence: progress.getProgressEvidence,
  getQuestionProgress: progress.getQuestionProgress,
  getSkillProgress: progress.getSkillPathProgress,
  saveAttempt: progress.saveQuestionAttempt,
  recordHint: progress.recordHintViewed,
  recordSolution: progress.recordWorkedSolutionViewed,
  recordSelfAssessment: progress.recordGuidedSelfAssessment,
  loadDraft: (identity) => drafts.loadAnswerDraft(storage(), identity),
  saveDraft: (identity, value, rich) => rich ? drafts.saveRichMathAnswerDraft(storage(), identity, value) : drafts.saveAnswerDraft(storage(), identity, value),
  clearDraft: (identity) => drafts.clearAnswerDraft(storage(), identity),
  acknowledgePath: recordPathCelebrated,
  acknowledgeStage: recordStageCelebrated,
  subscribe(listener) {
    window.addEventListener("stemforge:local-progress-updated", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", listener);
      window.removeEventListener("storage", listener);
    };
  },
  navigation: { home: "/dashboard", skill: "/subjects", notes: "/subjects/higher-maths/revision-notes", question: getQuestionHref },
};
