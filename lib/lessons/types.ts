import type { ContentStatus, SkillPath } from "@/data/types";
import type { GraphFunctionDefinition, GraphPoint, GraphViewport } from "@/lib/maths/expression-types";
import type { StructuredSolutionStep } from "@/lib/questions/worked-solution";

export const LESSON_SCHEMA_VERSION = 1 as const;

export type LessonQualification = {
  subject?: string;
  level?: string;
  label: string;
};

export type LessonSection = {
  sectionId: string;
  title: string;
  anchorBlockId: string;
};

export type LessonClosure = {
  recap: string;
  foundationsHref: string;
  confidencePrompt?: string;
};

type LessonBlockBase = {
  blockId: string;
};

export type LessonHeadingBlock = LessonBlockBase & {
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type LessonProseBlock = LessonBlockBase & {
  type: "prose";
  content: string;
};

export type CalloutSemantic =
  | "definition"
  | "formula"
  | "key_idea"
  | "common_mistake"
  | "warning"
  | "exam_tip"
  | "memory_trick"
  | "proof"
  | "real_world_intuition"
  | "challenge";

export type LessonCalloutBlock = LessonBlockBase & {
  type: "callout";
  semantic: CalloutSemantic;
  title: string;
  content: string;
  formula?: string;
  defaultCollapsed?: boolean;
};

export type LessonWorkedExampleBlock = LessonBlockBase & {
  type: "worked_example";
  title: string;
  prompt: string;
  steps: StructuredSolutionStep[];
  finalAnswer: string;
  explanation?: string;
  commonMistake?: string;
};

export type LessonFigureBlock = LessonBlockBase & {
  type: "figure";
  title: string;
  description: string;
  figure: {
    kind: "graph";
    viewport: GraphViewport;
    functions: GraphFunctionDefinition[];
    points?: GraphPoint[];
    selectedX?: number;
    tangent?: { x: number; y: number; gradient: number };
  };
};

export type LessonSelfCheckBlock = LessonBlockBase & {
  type: "self_check";
  title: string;
  prompt: string;
  answer: string;
  explanation?: string;
};

export type LessonBlock =
  | LessonHeadingBlock
  | LessonProseBlock
  | LessonCalloutBlock
  | LessonWorkedExampleBlock
  | LessonFigureBlock
  | LessonSelfCheckBlock;

export type LessonDocument = {
  lessonId: string;
  skillPathId: string;
  schemaVersion: typeof LESSON_SCHEMA_VERSION;
  contentRevision: number;
  contentStatus: ContentStatus;
  title: string;
  objective: string;
  qualification: LessonQualification;
  estimatedReadingMinutes: number;
  sections?: LessonSection[];
  blocks: LessonBlock[];
  closure: LessonClosure;
};

export type LessonResolution = {
  document: LessonDocument;
  source: "native" | "legacy_adapter";
};

export type LessonDocumentSkillPath = SkillPath & { lessonDocument?: LessonDocument };

export type HighlightEligibility = "text" | "whole_block" | "none";
