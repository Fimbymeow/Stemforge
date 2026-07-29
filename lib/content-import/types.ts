import type { Question } from "@/data/types";
import type { MarkerOutcomeKind, MarkingStrategy } from "@/lib/marking/types";

export const CONTENT_IMPORT_COMPILER_VERSION = 1;
export const MAX_IMPORT_SOURCE_BYTES = 1_000_000;
export const MAX_IMPORT_QUESTIONS = 500;
export const MAX_IMPORT_ANSWER_FIELDS = 32;
export const MAX_IMPORT_ACCEPTED_ANSWERS = 64;
export const MAX_IMPORT_TEXT_LENGTH = 100_000;

export type SourceLineRange = {
  start: number;
  end: number;
};

export type ImportDiagnostic = {
  code: string;
  severity: "error" | "warning";
  message: string;
  lineRange?: SourceLineRange;
  questionId?: string;
};

export type AnswerDeclarationShape = "bare_correct_answer" | "yaml_answer_fields";

export type ImportAnswerCandidate = {
  id: string;
  label: string;
  type: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  assessed?: boolean;
};

export type ImportQuestionIR = {
  id: string;
  sourceLineRange: SourceLineRange;
  declaredStage: string;
  subskill?: string;
  marks: number;
  calculatorStatus?: string;
  commandWord?: string;
  interactionType?: string;
  questionText: string;
  hint: string;
  workedSolution: string;
  commonMistake: string;
  qaNote?: string;
  answerCandidates: ImportAnswerCandidate[];
  answerDeclarationShape: AnswerDeclarationShape;
  explicitFieldAssessment: boolean;
  diagnostics: ImportDiagnostic[];
};

export type ContentBankIR = {
  compilerVersion: typeof CONTENT_IMPORT_COMPILER_VERSION;
  sourcePath: string;
  rawSourceHash: string;
  sourceBankId: string;
  sourceBankVersion: string;
  advisorySkillPathId?: string;
  questions: ImportQuestionIR[];
  diagnostics: ImportDiagnostic[];
};

export type BankImportConfiguration = {
  bankId: string;
  sourceBankVersion: string;
  targetSkillPathSlug: string;
  stageNameToStageId: Record<string, string>;
  pathOverrides?: Array<{
    questionIds: string[];
    targetSkillPathSlug: string;
    stageNameToStageId: Record<string, string>;
  }>;
  runMode: "new_content_only" | "includes_authorised_edits";
};

export type ImportRegistryStage = {
  id: string;
  names: string[];
};

export type ImportRegistryPath = {
  slug: string;
  subject: string;
  courseArea: string;
  specArea: string;
  name: string;
  stages: ImportRegistryStage[];
};

export type ImportRegistry = {
  paths: Map<string, ImportRegistryPath>;
  questions: Map<string, Question>;
};

export type ConfigurationValidationResult = {
  valid: boolean;
  configuration?: BankImportConfiguration;
  configurationHash?: string;
  diagnostics: ImportDiagnostic[];
};

export type RequiredCapability =
  | "structured_coordinate_pair"
  | "repeated_coordinate_nature_group"
  | "interval_set"
  | "structured_multi_field_answer"
  | "arbitrary_integration_constant"
  | "composite_algebraic_equivalence"
  | "equation_form_answer"
  | "closed_vocabulary_text_answer"
  | "prompt_diagram"
  | "graph_response";

export type ImportConversion =
  | "label_rename"
  | "stage_label_to_stage_id"
  | "marker_proven_lexical_normalisation"
  | "explicit_scaffolding_field_drop";

export type ImportBlocker = {
  code: string;
  message: string;
  requiredCapability?: RequiredCapability;
  candidateId?: string;
};

export type MarkerCompatibilityCheck = {
  strategy?: MarkingStrategy;
  targetOutcome?: MarkerOutcomeKind;
  aliasOutcomes: Array<{
    answer: string;
    outcomeKind: MarkerOutcomeKind;
    isCorrect: boolean | null;
  }>;
};

export type ImportClassification = {
  questionId: string;
  sourceLineRange: SourceLineRange;
  status: "ready" | "convertible" | "blocked" | "unchanged";
  targetSkillPathSlug?: string;
  targetStageId?: string;
  conversions: ImportConversion[];
  blockers: ImportBlocker[];
  diagnostics: ImportDiagnostic[];
  markerCompatibility?: MarkerCompatibilityCheck;
  canonicalQuestion?: Question;
};

export type CollisionFieldDiff = {
  field: string;
  existingValue: unknown;
  proposedValue: unknown;
  likelyImpact:
    | "presentation"
    | "metadata"
    | "content_revision"
    | "accepted_answers"
    | "marking_strategy"
    | "assessment_meaning"
    | "placement"
    | "identity"
    | "version_fields";
};

export type CollisionDiff = {
  questionId: string;
  identical: boolean;
  fields: CollisionFieldDiff[];
  availableVersionDecisions: VersionDecision["kind"][];
};

export type PlannedOutput = {
  questionId: string;
  path: string;
  contentHash: string;
};

export type PreviewDecisionPayload = {
  payloadVersion: 1;
  compilerVersion: typeof CONTENT_IMPORT_COMPILER_VERSION;
  importable: boolean;
  sourcePath: string;
  sourceBytesHash: string;
  configurationPath: string;
  configurationBytesHash: string;
  configuration: BankImportConfiguration;
  configurationHash: string;
  liveCanonicalContentSnapshotHash: string;
  sourceQuestionIds: string[];
  classifications: ImportClassification[];
  eligibleCandidateIds: string[];
  blockedIds: string[];
  unchangedIds: string[];
  collisionDiffs: CollisionDiff[];
  plannedOutputs: PlannedOutput[];
  diagnostics: ImportDiagnostic[];
};

export type VersionDecision =
  | { kind: "content_revision_bump" }
  | { kind: "question_version_bump" };

export type ApprovalReceipt = {
  receiptVersion: 1;
  previewHash: string;
  previewDecisionPayload: PreviewDecisionPayload;
  approvedQuestionIds: string[];
  explicitlyExcludedCandidateIds: Array<{
    id: string;
    reason: string;
  }>;
  versionDecisions: Record<string, VersionDecision>;
  approvedAt: string;
};

export type ImportReceipt = {
  receiptVersion: 1;
  approvalReceiptHash: string;
  appliedQuestionIds: string[];
  outputPaths: string[];
  finalOutputHashes: Record<string, string>;
  appliedAt: string;
  compilerVersion: typeof CONTENT_IMPORT_COMPILER_VERSION;
};

export type GeneratedOutput = {
  path: string;
  bytes: Uint8Array;
  hash: string;
};

export type PreparedImportReceipt = GeneratedOutput & {
  validate: (bytes: Uint8Array) => void;
};
