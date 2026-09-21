import type { SkillPath } from "@/data/types";
import type { ProgressEvidence, QuestionProgressState, SkillPathProgress } from "@/lib/progress/types";
import type * as progress from "@/lib/local-progress";
import type * as drafts from "@/lib/questions/answer-drafts";
import type * as completion from "@/lib/completion-tracking";

/** Learning I/O seam. No auth, sync, reporting or entitlement capabilities belong here. */
export interface LearningRuntime {
  readonly kind: "production" | "demo";
  readonly resetVersion?: number;
  getEvidence(): ProgressEvidence;
  getQuestionProgress(id: string, evidence?: ProgressEvidence): QuestionProgressState;
  getSkillProgress(skill: SkillPath, evidence?: ProgressEvidence): SkillPathProgress;
  saveAttempt: typeof progress.saveQuestionAttempt;
  recordHint: typeof progress.recordHintViewed;
  recordSolution: typeof progress.recordWorkedSolutionViewed;
  recordSelfAssessment: typeof progress.recordGuidedSelfAssessment;
  loadDraft(identity: drafts.AnswerDraftIdentity): drafts.AnswerDraft | null;
  saveDraft(identity: drafts.AnswerDraftIdentity, value: string, rich: boolean): boolean;
  clearDraft(identity: drafts.AnswerDraftIdentity): boolean;
  acknowledgePath: typeof completion.recordPathCelebrated;
  acknowledgeStage: typeof completion.recordStageCelebrated;
  subscribe(listener: () => void): () => void;
  navigation: { home: string; skill: string; notes: string; question(id: string): string | null };
}
