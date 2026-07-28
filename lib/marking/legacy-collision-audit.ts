import { compareAcceptedAnswers } from "@/lib/answer-engine";
import { parseNumericLiteral } from "@/lib/marking/numeric";
import { parsePolynomial } from "@/lib/marking/polynomial";

export type LegacyCollisionClassification = "equivalent" | "harmless_notation" | "malformed" | "mathematically_different";
export type LegacyCollision = { acceptedAnswer: string; input: string; classification: LegacyCollisionClassification };
export type LegacyCollisionStrategy =
  | { strategy: "numeric" }
  | { strategy: "polynomial_form"; variable: string };

const REMOVED_MULTIPLICATION_MARKERS = ["*", "×", "·"] as const;

export function auditLegacyNumericCollisions(target: string): LegacyCollision[] {
  return auditLegacyAcceptedAnswerCollisions([target], { strategy: "numeric" });
}

export function auditLegacyAcceptedAnswerCollisions(
  acceptedAnswers: readonly string[],
  strategy: LegacyCollisionStrategy,
): LegacyCollision[] {
  const collisions = new Map<string, LegacyCollision>();
  for (const acceptedAnswer of acceptedAnswers) {
    for (const candidate of generateCandidates(acceptedAnswer)) {
      if (!compareAcceptedAnswers(candidate.input, acceptedAnswers).isCorrect) continue;
      const collision = {
        acceptedAnswer,
        input: candidate.input,
        classification: classify(acceptedAnswer, candidate, strategy),
      };
      const key = `${collision.input}\u0000${collision.classification}`;
      if (!collisions.has(key)) collisions.set(key, collision);
    }
  }
  return [...collisions.values()].sort((left, right) =>
    left.input.localeCompare(right.input) || left.acceptedAnswer.localeCompare(right.acceptedAnswer));
}

type Candidate = {
  input: string;
  transformation: "digit_split_marker" | "digit_split_space" | "removable_marker" | "removable_braces" | "unicode_minus";
  digitSplit?: { left: string; right: string; coefficient: boolean };
};

function generateCandidates(acceptedAnswer: string): Candidate[] {
  const candidates: Candidate[] = [];
  const digitRuns = [...acceptedAnswer.matchAll(/\d{2,}/g)];
  for (const run of digitRuns) {
    const start = run.index;
    if (start === undefined) continue;
    const end = start + run[0].length;
    const coefficient = isCoefficientRun(acceptedAnswer, start, end);
    for (let offset = 1; offset < run[0].length; offset += 1) {
      const index = start + offset;
      const digitSplit = { left: run[0].slice(0, offset), right: run[0].slice(offset), coefficient };
      for (const marker of REMOVED_MULTIPLICATION_MARKERS) {
        candidates.push({
          input: `${acceptedAnswer.slice(0, index)}${marker}${acceptedAnswer.slice(index)}`,
          transformation: "digit_split_marker",
          digitSplit,
        });
      }
      candidates.push({
        input: `${acceptedAnswer.slice(0, index)} ${acceptedAnswer.slice(index)}`,
        transformation: "digit_split_space",
        digitSplit,
      });
    }
  }
  for (const marker of REMOVED_MULTIPLICATION_MARKERS) {
    candidates.push({ input: `${marker}${acceptedAnswer}`, transformation: "removable_marker" });
    candidates.push({ input: `${acceptedAnswer}${marker}`, transformation: "removable_marker" });
    candidates.push({ input: `${marker}${marker}${acceptedAnswer}`, transformation: "removable_marker" });
    candidates.push({ input: `${acceptedAnswer}${marker}${marker}`, transformation: "removable_marker" });
  }
  candidates.push({ input: `{${acceptedAnswer}}`, transformation: "removable_braces" });
  for (let index = 0; index < acceptedAnswer.length; index += 1) {
    candidates.push({
      input: `${acceptedAnswer.slice(0, index)}{${acceptedAnswer[index]}}${acceptedAnswer.slice(index + 1)}`,
      transformation: "removable_braces",
    });
  }
  if (acceptedAnswer.includes("-")) {
    candidates.push({ input: acceptedAnswer.replaceAll("-", "\u2212"), transformation: "unicode_minus" });
  }
  return candidates;
}

function classify(
  target: string,
  candidate: Candidate,
  strategy: LegacyCollisionStrategy,
): LegacyCollisionClassification {
  if (strategy.strategy === "numeric") {
    const parsedTarget = parseNumericLiteral(target);
    const parsedInput = parseNumericLiteral(candidate.input);
    if (parsedTarget.status === "parsed" && parsedInput.status === "parsed" &&
        parsedTarget.value.numerator === parsedInput.value.numerator &&
        parsedTarget.value.denominator === parsedInput.value.denominator) return "equivalent";
  } else {
    const parsedTarget = parsePolynomial(target, strategy.variable);
    const parsedInput = parsePolynomial(candidate.input, strategy.variable);
    if (parsedTarget.status === "parsed" && parsedInput.status === "parsed" &&
        parsedTarget.normalized === parsedInput.normalized) return "equivalent";
  }
  if (candidate.transformation === "digit_split_marker" && candidate.digitSplit) {
    const { left, right, coefficient } = candidate.digitSplit;
    if ((strategy.strategy === "numeric" || coefficient) && BigInt(left) * BigInt(right) !== BigInt(`${left}${right}`)) {
      return "mathematically_different";
    }
  }
  if (candidate.transformation === "removable_braces" || candidate.transformation === "unicode_minus") {
    return "harmless_notation";
  }
  return "malformed";
}

function isCoefficientRun(answer: string, start: number, end: number) {
  const before = answer.slice(0, start);
  const after = answer.slice(end);
  const beginsTerm = start === 0 || /[+-]$/.test(before);
  return beginsTerm && /^(?:\*)?[a-z]/i.test(after);
}
