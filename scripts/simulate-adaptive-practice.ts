import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonicalContent } from "../data/canonical-content";
import type { Question } from "../data/types";
import { createAdaptiveQuickPracticeSelection } from "../lib/practice/adaptive-practice";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";

const now = new Date("2026-07-13T12:00:00.000Z");
const empty = (): ProgressEvidence => ({ attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] });
const questions = (pathId: string) => canonicalContent.questions.filter((question) => question.skillPathId === pathId && question.contentStatus === "active");
const attemptFor = (question: Question, correct: boolean, sequence: number, attemptedAt = "2026-07-12T10:00:00.000Z"): QuestionAttempt => ({
  eventId: `adaptive_sim_${sequence}_${question.id}`,
  questionId: question.id,
  skillPathId: question.skillPathId!,
  stageId: question.stageId!,
  isCorrect: correct,
  answer: correct ? "correct" : "wrong",
  attemptedAt,
  sequence,
  isGenuine: true,
  hintViewedBeforeSubmission: false,
  supportKnowledge: "known",
  versionEvidence: { kind: "known", questionVersion: question.questionVersion },
});

const basic = questions("basic-differentiation");
const chain = questions("chain-rule");
const basicComplete: ProgressEvidence = { ...empty(), attempts: basic.map((question, index) => attemptFor(question, true, index + 1, "2026-06-01T10:00:00.000Z")) };
const scenarios = [
  { id: "baseline", evidence: empty(), confidence: new Map<string, "needs_work" | "developing" | "confident">() },
  { id: "basic-mistake", evidence: { ...empty(), attempts: [attemptFor(basic[0], false, 1)] }, confidence: new Map([["chain-rule", "needs_work" as const]]) },
  { id: "chain-mistake", evidence: { ...basicComplete, attempts: [...basicComplete.attempts, attemptFor(chain[0], false, 100)] }, confidence: new Map([["chain-rule", "confident" as const]]) },
  { id: "review-separate", evidence: basicComplete, confidence: new Map<string, "needs_work" | "developing" | "confident">() },
];

const results = scenarios.flatMap((scenario) => [10, 20, 30].map((durationMinutes) => {
  const input = { evidence: scenario.evidence, learnerConfidence: scenario.confidence, durationMinutes: durationMinutes as 10 | 20 | 30, now, seed: `simulation:${scenario.id}` };
  const first = createAdaptiveQuickPracticeSelection(input);
  const repeat = createAdaptiveQuickPracticeSelection(input);
  const references = first.result.session?.questionReferences ?? [];
  assert.deepEqual(references, repeat.result.session?.questionReferences, `${scenario.id} must be deterministic`);
  assert.equal(new Set(references.map((item) => item.questionId)).size, references.length, `${scenario.id} must not duplicate questions`);
  assert(references.every((reference) => canonicalContent.questions.some((question) => question.id === reference.questionId && question.contentStatus === "active")), `${scenario.id} must select active content only`);
  assert.equal(first.result.session?.mode, "targeted", `${scenario.id} must remain ordinary Practice`);
  if (scenario.id === "basic-mistake") assert.equal(first.recommendation?.primaryPathId, "basic-differentiation");
  if (scenario.id === "chain-mistake") assert.equal(first.recommendation?.primaryPathId, "chain-rule");
  if (scenario.id === "review-separate") assert.equal(first.reviewOffer?.pathId, "basic-differentiation");
  return {
    scenario: scenario.id,
    durationMinutes,
    primaryPathId: first.recommendation?.primaryPathId ?? null,
    reasons: first.recommendation?.reasons ?? [],
    reviewOfferPathId: first.reviewOffer?.pathId ?? null,
    questionIds: references.map((item) => item.questionId),
  };
}));

const serialized = JSON.stringify(results);
const fingerprint = createHash("sha256").update(serialized).digest("hex").slice(0, 8);
console.log(JSON.stringify({ scenarios: results.length, violations: 0, fingerprint }, null, 2));
