import type { Question, SkillPath } from "@/data/types";
import type { ResolvedQuestionContext, ResolvedSkillPath } from "@/lib/content-resolver";
import type { ReviewTargetAssignment } from "@/lib/review/types";

export const PRACTICE_SESSION_SCHEMA_VERSION = 3 as const;
export const PRACTICE_SESSIONS_STORAGE_KEY = "stemforge.practiceSessions.v1";
export const MAX_PRACTICE_QUESTIONS = 500;
export const MAX_PRACTICE_HISTORY = 20;
export const MAX_TIME_LIMIT_SECONDS = 3 * 60 * 60;

export type PracticeMode = "targeted" | "mixed" | "needs_work" | "retry_incorrect" | "review";
export type PracticeSessionStatus = "active" | "completed" | "abandoned";
export type PracticeSessionOrigin =
  | "question_bank_custom"
  | "subject_review"
  | "quick_practice"
  | "configured_practice"
  | "working_context_practice"
  | "retry_incorrect"
  | "retry_skipped"
  | "scheduled_review";
export type PracticeTiming = { type: "untimed" } | { type: "timed"; timeLimitSeconds: number; elapsedSeconds: number };

export type PracticeQuestionReference = {
  subjectId: string;
  courseId: string;
  pathId: string;
  stageId: string;
  questionId: string;
  questionVersion: number;
  contentRevision: number;
};

export type PracticeSelectionMetadata = {
  seed: string;
  requestedCount: number;
  availableCount: number;
  selectedCount: number;
  fullySatisfied: boolean;
  shortageReason: string | null;
  excludedByReason: Record<string, number>;
  includedPathIds: string[];
  createdAt: string;
};

export type PracticeSession = {
  schemaVersion: typeof PRACTICE_SESSION_SCHEMA_VERSION;
  sessionId: string;
  origin: PracticeSessionOrigin;
  subjectId: string;
  parentSessionId?: string;
  mode: PracticeMode;
  courseId: string;
  selectedPathIds: string[];
  questionReferences: PracticeQuestionReference[];
  currentQuestionIndex: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: PracticeSessionStatus;
  timing: PracticeTiming;
  selectionMetadata: PracticeSelectionMetadata;
  skippedQuestionIds: string[];
  finalSkippedQuestionIds?: string[];
  reviewTargets?: ReviewTargetAssignment[];
};

export type PracticeSessionStore = {
  schemaVersion: typeof PRACTICE_SESSION_SCHEMA_VERSION;
  activeSessionId: string | null;
  sessions: PracticeSession[];
};

export type PracticeEligibilityReason =
  | "archived"
  | "unresolvable"
  | "unsupported_question_type"
  | "missing_metadata"
  | "version_incompatible";

export type PracticeEligibility = { eligible: true } | { eligible: false; reason: PracticeEligibilityReason };

export type EligiblePracticeQuestion = {
  reference: PracticeQuestionReference;
  question: Question;
  questionContext: ResolvedQuestionContext;
  pathContext: ResolvedSkillPath;
  path: SkillPath;
};

export type PracticeSelectionInput = {
  origin?: PracticeSessionOrigin;
  mode: PracticeMode;
  courseId: string;
  selectedPathIds: string[];
  requestedCount: number;
  seed: string;
  timing?: PracticeTiming;
  now?: Date;
};

export type PracticeSelectionResult = {
  session: PracticeSession | null;
  eligibleQuestions: EligiblePracticeQuestion[];
  excludedByReason: Record<string, number>;
  shortageReason: string | null;
};
