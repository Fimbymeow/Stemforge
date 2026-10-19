import assert from "node:assert/strict";
import test from "node:test";
import { canonicalQuestionModuleRegistry } from "../data/canonical-content";
import { higherPhysics } from "../data/higher-physics";
import { contentResolver } from "../lib/content-resolver";
import { derivePracticeDependencies, isPracticeCompatibleSkill } from "../lib/practice-model";
import { calculateSkillPathProgress, selectNextQuestionId } from "../lib/progress/calculations";
import type { ProgressEvidence } from "../lib/progress/types";
import { deriveSkillReviewState } from "../lib/review/derivation";
import { compatibilityAttempt } from "./fixtures/practice-compatibility";

const emptyEvidence = (): ProgressEvidence => ({
  attempts: [],
  supportEvents: [],
  guidedSelfAssessments: [],
  achievementSnapshots: [],
  reviewEvents: [],
  flashcardReviews: [],
});

test("live Higher Maths skills expose the approved continuous Practice projections", () => {
  const basic = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const chain = contentResolver.getPathContext("chain-rule")!.skillPath;

  assert.equal(isPracticeCompatibleSkill(basic), true);
  assert.equal(isPracticeCompatibleSkill(chain), true);
  assert.equal(basic.practiceQuestionIds?.length, 8);
  assert.equal(chain.practiceQuestionIds?.length, 34);
  assert.deepEqual(basic.practiceQuestionIds, basic.learningStages?.flatMap((stage) => stage.questionIds));
  assert.deepEqual(chain.practiceQuestionIds, chain.learningStages?.flatMap((stage) => stage.questionIds));
});

test("next-question selection obeys Practice order rather than historical stage order", () => {
  const source = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const reversed = { ...source, practiceQuestionIds: [...source.practiceQuestionIds!].reverse() };
  assert.equal(selectNextQuestionId(reversed, emptyEvidence()), reversed.practiceQuestionIds[0]);
});

test("skill dependencies distinguish universal prerequisites from question-level conditions", () => {
  const basic = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const chain = contentResolver.getPathContext("chain-rule")!.skillPath;
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;

  assert.deepEqual(derivePracticeDependencies(basic), { prerequisites: [], conditional: [] });
  assert.deepEqual(derivePracticeDependencies(chain), {
    prerequisites: [{
      skillPathId: "basic-differentiation",
      name: "Basic differentiation",
      href: "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    }],
    conditional: [],
  });
  assert.deepEqual(derivePracticeDependencies(tangents), {
    prerequisites: [{
      skillPathId: "basic-differentiation",
      name: "Basic differentiation",
      href: "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    }],
    conditional: [{
      skillPathId: "chain-rule",
      name: "Chain rule",
      href: "/subjects/higher-maths/calculus/differentiation/chain-rule",
    }],
  });
});

test("Practice-only Tangents increments count progress without inventing legacy mastery or Review eligibility", () => {
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;
  const questionId = tangents.practiceQuestionIds![0];
  const progress = calculateSkillPathProgress(tangents, {
    ...emptyEvidence(),
    attempts: [compatibilityAttempt(questionId, 1, true)],
  }, contentResolver.getQuestionVersions());
  assert.deepEqual({ completed: progress.completedQuestionIds.length, total: progress.totalQuestions, percentage: progress.completionPercentage }, {
    completed: 1, total: 30, percentage: 3,
  });
  assert.equal(progress.masteryScore, 0);
  assert.deepEqual(progress.stageProgress, {});
  assert.equal(deriveSkillReviewState(tangents, emptyEvidence()).eligible, false);
});

test("published Tangents uses its 30-question Practice projection while Higher Physics retains its legacy stage model", () => {
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;
  const registration = canonicalQuestionModuleRegistry.find((item) => item.skillPathId === tangents.slug);

  assert.equal(registration?.runtimeStatus, "wired");
  assert.equal(tangents.isAvailable, true);
  assert.equal(tangents.status, "available");
  assert.equal(tangents.practiceQuestionIds?.length, 30);
  assert.deepEqual(
    tangents.practiceQuestionIds,
    Array.from({ length: 30 }, (_, index) => `hm-calc-tangent-q-${String(index + 1).padStart(3, "0")}`),
  );
  assert.equal(contentResolver.getPracticeQuestions(tangents).length, 30);
  const first = contentResolver.getQuestionContext(tangents.practiceQuestionIds![0]);
  const last = contentResolver.getQuestionContext(tangents.practiceQuestionIds!.at(-1)!);
  assert.deepEqual({ stage: first?.stage.name, position: first?.questionIndexInPath, previous: first?.previousQuestion }, {
    stage: "Practice", position: 0, previous: undefined,
  });
  assert.deepEqual({ stage: last?.stage.name, position: last?.questionIndexInPath, next: last?.nextQuestion }, {
    stage: "Practice", position: 29, next: undefined,
  });
  assert.equal("practiceQuestionIds" in higherPhysics, false);
  assert.deepEqual(higherPhysics.learningStages?.map((stage) => stage.name), [
    "Foundations",
    "Applications",
    "Past Paper-style Questions",
  ]);
});
