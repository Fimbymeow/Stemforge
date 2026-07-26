import type { AnswerType, Question } from "@/data/types";

const DEFAULT_MAX_LENGTH = 72;
const ELLIPSIS = "…";

/** Answer types that are primarily visual and may carry little to no readable prompt text. */
const VISUAL_TYPE_FALLBACKS: Partial<Record<AnswerType, string>> = {
  graph_structured: "Graph question — open to preview.",
  nature_table: "Table question — open to preview.",
};

const LATEX_SYMBOL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\\times/g, "×"],
  [/\\cdot/g, "·"],
  [/\\div/g, "÷"],
  [/\\pm/g, "±"],
  [/\\leq/g, "≤"],
  [/\\geq/g, "≥"],
  [/\\neq/g, "≠"],
  [/\\approx/g, "≈"],
  [/\\infty/g, "∞"],
  [/\\pi/g, "π"],
  [/\\theta/g, "θ"],
  [/\\alpha/g, "α"],
  [/\\beta/g, "β"],
  [/\\ldots|\\dots/g, "..."],
  [/\\int/g, "∫"],
];

function replaceFractions(value: string): string {
  let result = value;
  for (let i = 0; i < 5; i += 1) {
    const next = result.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2");
    if (next === result) break;
    result = next;
  }
  return result;
}

function replaceRoots(value: string): string {
  return value
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\sqrt(\w)/g, "sqrt($1)");
}

function stripResidualCommands(value: string): string {
  let result = value;
  for (let i = 0; i < 5; i += 1) {
    const next = result.replace(/\\[a-zA-Z]+\s*\{([^{}]*)\}/g, "$1");
    if (next === result) break;
    result = next;
  }
  return result.replace(/\\[a-zA-Z]+/g, "");
}

function stripMathDelimiters(value: string): string {
  return value
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner: string) => ` ${inner} `)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner: string) => ` ${inner} `)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner: string) => ` ${inner} `)
    .replace(/\$([^$]*?)\$/g, (_match, inner: string) => ` ${inner} `)
    // Unmatched/stray delimiters: drop the delimiter characters themselves rather than crash or leak them.
    .replace(/\$\$|\$|\\\[|\\\]|\\\(|\\\)/g, " ");
}

function stripMarkdownDecoration(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\{\{2,3\}/g, "")
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/_\{([^{}]*)\}/g, "_$1");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toPlainText(source: string): string {
  const withoutMathDelimiters = stripMathDelimiters(source);
  const withSymbols = LATEX_SYMBOL_REPLACEMENTS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), withoutMathDelimiters);
  const withFractions = replaceFractions(withSymbols);
  const withRoots = replaceRoots(withFractions);
  const withoutResidualCommands = stripResidualCommands(withRoots);
  const withoutMarkdown = stripMarkdownDecoration(withoutResidualCommands);
  return collapseWhitespace(withoutMarkdown);
}

function truncateAtWordBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}${ELLIPSIS}`;
}

/**
 * Deterministic, non-rendering plain-text excerpt for a Question Bank row. Never mounts
 * MathContent/Markdown/KaTeX and never leaks raw LaTeX command sequences.
 */
export function buildQuestionBankExcerpt(
  question: Pick<Question, "questionText" | "title" | "answerType">,
  maxLength: number = DEFAULT_MAX_LENGTH,
): string {
  const plainText = toPlainText(question.questionText ?? "");
  if (plainText.length > 0) return truncateAtWordBoundary(plainText, maxLength);

  const visualFallback = VISUAL_TYPE_FALLBACKS[question.answerType];
  if (visualFallback) return visualFallback;

  return truncateAtWordBoundary(collapseWhitespace(question.title ?? ""), maxLength);
}
