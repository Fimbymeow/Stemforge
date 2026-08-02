import type {
  CalloutSemantic,
  HighlightEligibility,
  LessonBlock,
  LessonDocument,
} from "@/lib/lessons/types";
import { LESSON_SCHEMA_VERSION } from "@/lib/lessons/types";

export type LessonValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type LessonValidationResult = {
  valid: boolean;
  issues: LessonValidationIssue[];
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTENT_STATUSES = new Set(["active", "archived"]);
const BLOCK_TYPES = new Set(["heading", "prose", "callout", "worked_example", "figure", "self_check"]);
const CALLOUT_SEMANTICS = new Set<CalloutSemantic>([
  "definition", "formula", "key_idea", "common_mistake", "warning",
  "exam_tip", "memory_trick", "proof", "real_world_intuition", "challenge",
]);

export function validateLessonDocument(input: unknown): LessonValidationResult {
  const issues: LessonValidationIssue[] = [];
  if (!isRecord(input)) return invalidRoot("Lesson document must be an object.");

  requiredId(input.lessonId, "lessonId", issues);
  requiredId(input.skillPathId, "skillPathId", issues);
  if (input.schemaVersion !== LESSON_SCHEMA_VERSION) add(issues, "invalid-schema-version", "schemaVersion", `schemaVersion must be ${LESSON_SCHEMA_VERSION}.`);
  positiveInteger(input.contentRevision, "contentRevision", issues);
  if (!CONTENT_STATUSES.has(String(input.contentStatus))) add(issues, "invalid-content-status", "contentStatus", "contentStatus must be active or archived.");
  requiredText(input.title, "title", issues);
  requiredText(input.objective, "objective", issues);
  positiveInteger(input.estimatedReadingMinutes, "estimatedReadingMinutes", issues);

  if (!isRecord(input.qualification)) add(issues, "invalid-qualification", "qualification", "qualification metadata is required.");
  else {
    requiredText(input.qualification.label, "qualification.label", issues);
    optionalText(input.qualification.subject, "qualification.subject", issues);
    optionalText(input.qualification.level, "qualification.level", issues);
  }

  const blockIds = new Set<string>();
  if (!Array.isArray(input.blocks) || input.blocks.length === 0) add(issues, "empty-blocks", "blocks", "A lesson must contain at least one ordered block.");
  else input.blocks.forEach((block, index) => {
    const result = validateLessonBlock(block, `blocks[${index}]`);
    issues.push(...result.issues);
    if (isRecord(block) && typeof block.blockId === "string") {
      if (blockIds.has(block.blockId)) add(issues, "duplicate-block-id", `blocks[${index}].blockId`, `Duplicate blockId "${block.blockId}".`);
      blockIds.add(block.blockId);
    }
  });

  if (input.sections !== undefined) {
    if (!Array.isArray(input.sections)) add(issues, "invalid-sections", "sections", "sections must be an ordered array.");
    else {
      const sectionIds = new Set<string>();
      input.sections.forEach((section, index) => {
        const path = `sections[${index}]`;
        if (!isRecord(section)) return add(issues, "invalid-section", path, "Section must be an object.");
        requiredId(section.sectionId, `${path}.sectionId`, issues);
        requiredText(section.title, `${path}.title`, issues);
        requiredId(section.anchorBlockId, `${path}.anchorBlockId`, issues);
        if (typeof section.sectionId === "string" && sectionIds.has(section.sectionId)) add(issues, "duplicate-section-id", `${path}.sectionId`, `Duplicate sectionId "${section.sectionId}".`);
        if (typeof section.sectionId === "string") sectionIds.add(section.sectionId);
        if (typeof section.anchorBlockId === "string" && !blockIds.has(section.anchorBlockId)) add(issues, "invalid-section-anchor", `${path}.anchorBlockId`, `Section anchor "${section.anchorBlockId}" does not match a blockId.`);
      });
    }
  }

  if (!isRecord(input.closure)) add(issues, "missing-closure", "closure", "An explicit lesson closure is required.");
  else {
    requiredText(input.closure.recap, "closure.recap", issues);
    if (typeof input.closure.foundationsHref !== "string" || !input.closure.foundationsHref.startsWith("/")) add(issues, "invalid-foundations-href", "closure.foundationsHref", "foundationsHref must be an internal path.");
    optionalText(input.closure.confidencePrompt, "closure.confidencePrompt", issues);
  }

  return { valid: issues.length === 0, issues };
}

export function validateLessonBlock(input: unknown, path = "block"): LessonValidationResult {
  const issues: LessonValidationIssue[] = [];
  if (!isRecord(input)) return { valid: false, issues: [{ code: "invalid-block", path, message: "Block must be an object." }] };
  requiredId(input.blockId, `${path}.blockId`, issues);
  if (!BLOCK_TYPES.has(String(input.type))) {
    add(issues, "invalid-block-type", `${path}.type`, `Unsupported block type "${String(input.type)}".`);
    return { valid: false, issues };
  }

  switch (input.type) {
    case "heading":
      if (input.level !== 2 && input.level !== 3) add(issues, "invalid-heading-level", `${path}.level`, "Heading level must be 2 or 3.");
      requiredText(input.text, `${path}.text`, issues);
      break;
    case "prose":
      requiredText(input.content, `${path}.content`, issues);
      break;
    case "callout":
      if (!CALLOUT_SEMANTICS.has(input.semantic as CalloutSemantic)) add(issues, "invalid-callout-semantic", `${path}.semantic`, "Callout semantic is not supported by schema V1.");
      requiredText(input.title, `${path}.title`, issues);
      requiredText(input.content, `${path}.content`, issues);
      optionalText(input.formula, `${path}.formula`, issues);
      if (input.defaultCollapsed !== undefined && typeof input.defaultCollapsed !== "boolean") add(issues, "invalid-default-collapsed", `${path}.defaultCollapsed`, "defaultCollapsed must be Boolean.");
      break;
    case "worked_example":
      requiredText(input.title, `${path}.title`, issues);
      requiredText(input.prompt, `${path}.prompt`, issues);
      requiredText(input.finalAnswer, `${path}.finalAnswer`, issues);
      optionalText(input.explanation, `${path}.explanation`, issues);
      optionalText(input.commonMistake, `${path}.commonMistake`, issues);
      if (!Array.isArray(input.steps) || input.steps.length === 0) add(issues, "invalid-worked-steps", `${path}.steps`, "Worked example requires at least one step.");
      else input.steps.forEach((step, index) => {
        if (!isRecord(step)) return add(issues, "invalid-worked-step", `${path}.steps[${index}]`, "Worked step must be an object.");
        requiredText(step.title, `${path}.steps[${index}].title`, issues);
        requiredText(step.body, `${path}.steps[${index}].body`, issues);
      });
      break;
    case "figure":
      requiredText(input.title, `${path}.title`, issues);
      requiredText(input.description, `${path}.description`, issues);
      if (!isRecord(input.figure) || input.figure.kind !== "graph") add(issues, "invalid-figure", `${path}.figure`, "Schema V1 figures must use the graph renderer.");
      else {
        if (!isRecord(input.figure.viewport)) add(issues, "invalid-figure-viewport", `${path}.figure.viewport`, "Graph viewport is required.");
        if (!Array.isArray(input.figure.functions) || input.figure.functions.length === 0) add(issues, "invalid-figure-functions", `${path}.figure.functions`, "Graph figure requires at least one function.");
      }
      break;
    case "self_check":
      requiredText(input.title, `${path}.title`, issues);
      requiredText(input.prompt, `${path}.prompt`, issues);
      requiredText(input.answer, `${path}.answer`, issues);
      optionalText(input.explanation, `${path}.explanation`, issues);
      break;
  }
  return { valid: issues.length === 0, issues };
}

/**
 * Canonical future-annotation text. It is derived solely from authored block fields,
 * joined with single newlines, trimmed, and never from browser DOM or KaTeX output.
 * Future offsets must be block-local offsets into this exact string for the matching
 * lessonId/contentRevision/blockId tuple.
 */
export function getLessonBlockPlainText(block: LessonBlock): string {
  switch (block.type) {
    case "heading": return block.text.trim();
    case "prose": return block.content.trim();
    case "callout": return [block.title, block.content].map((value) => value.trim()).filter(Boolean).join("\n");
    case "worked_example": return [
      block.title,
      block.prompt,
      ...block.steps.flatMap((step) => [step.title, step.body]),
      block.explanation,
      block.commonMistake,
    ].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()).join("\n");
    case "figure": return [block.title, block.description].join("\n").trim();
    case "self_check": return [block.title, block.prompt, block.answer, block.explanation].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()).join("\n");
  }
}

export function getLessonBlockHighlightEligibility(block: LessonBlock): HighlightEligibility {
  if (block.type === "prose" || block.type === "worked_example") return "text";
  if (block.type === "callout") {
    if (block.semantic === "formula") return "whole_block";
    if (["definition", "key_idea", "common_mistake", "exam_tip"].includes(block.semantic)) return "text";
  }
  return "none";
}

export function estimateLessonReadingMinutes(blocks: readonly LessonBlock[], wordsPerMinute = 200) {
  const wordCount = blocks
    .map(getLessonBlockPlainText)
    .join(" ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function getMalformedBlockDisposition(block: unknown, environment: "development" | "test" | "production") {
  const validation = validateLessonBlock(block);
  if (validation.valid) return { action: "render" as const, issues: validation.issues };
  if (environment !== "production") return { action: "diagnostic" as const, issues: validation.issues };
  const type = isRecord(block) ? block.type : null;
  const structuralGap = type === "heading" || type === "worked_example" || type === "figure" || type === "self_check";
  return { action: structuralGap ? "calm_fallback" as const : "omit" as const, issues: validation.issues };
}

function invalidRoot(message: string): LessonValidationResult {
  return { valid: false, issues: [{ code: "invalid-document", path: "document", message }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: LessonValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message });
}

function requiredId(value: unknown, path: string, issues: LessonValidationIssue[]) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) add(issues, "invalid-stable-id", path, `${path} must be a lowercase hyphenated stable ID.`);
}

function requiredText(value: unknown, path: string, issues: LessonValidationIssue[]) {
  if (typeof value !== "string" || !value.trim()) add(issues, "missing-text", path, `${path} must contain text.`);
}

function optionalText(value: unknown, path: string, issues: LessonValidationIssue[]) {
  if (value !== undefined && (typeof value !== "string" || !value.trim())) add(issues, "invalid-optional-text", path, `${path} must be omitted or contain text.`);
}

function positiveInteger(value: unknown, path: string, issues: LessonValidationIssue[]) {
  if (!Number.isInteger(value) || Number(value) <= 0) add(issues, "invalid-positive-integer", path, `${path} must be a positive integer.`);
}
