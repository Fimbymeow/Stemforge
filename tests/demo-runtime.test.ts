import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createDemoRuntime } from "../lib/demo/runtime";
import { demoNavigation, getDemoPathway, getDemoQuestion, getDemoQuestions, getDemoSkill, isDemoRoute } from "../lib/demo/content";
import { markQuestionAnswer } from "../lib/answer-engine";
import { contentResolver } from "../lib/content-resolver";
import { productionLearningRuntime } from "../lib/learning/production-runtime";
import * as production from "../lib/local-progress";
import { hasPreviewInteraction, previewContinueHref, previewOutcomeLabel, previewQuestionAction, WALKTHROUGH_IDS } from "../lib/demo/walkthrough";
import { classifyAnswerFeedback } from "../lib/questions/answer-feedback";

const question = getDemoQuestions().find((item) => item.answerType === "algebraic")!;
const identity = { questionId: question.id, questionVersion: question.questionVersion, contentRevision: question.contentRevision };
function input(answer = "15(3x+2)^4") {
  const marked = markQuestionAnswer(question, answer);
  return { questionId: question.id, skillPathId: "chain-rule", stageId: question.stageId!, answer,
    attemptedAt: "2026-09-18T12:00:00.000Z", isCorrect: marked.isCorrect, outcomeKind: "graded" as const,
    strategy: marked.strategy, strategyVersion: marked.strategyVersion };
}

test("preview starts empty and derives honest canonical progress", () => {
  const runtime = createDemoRuntime();
  assert.deepEqual(runtime.getEvidence(), production.getEmptyProgressEvidence());
  assert.equal(runtime.getSkillProgress(getDemoSkill()!.skillPath).completedQuestionIds.length, 0);
  assert.equal(runtime.getSkillProgress(getDemoSkill()!.skillPath).totalQuestions, getDemoQuestions().length);
});

test("resolver-derived allowlist accepts every canonical Chain Rule question and rejects everything else", () => {
  const allowed = new Set(getDemoQuestions().map((item) => item.id));
  assert.equal(allowed.size, 34);
  for (const item of contentResolver.getQuestions()) assert.equal(Boolean(getDemoQuestion(item.id)), allowed.has(item.id));
  for (const id of ["unknown", "hm-calc-diff-basic-f-001", "physics-1"]) {
    assert.equal(getDemoQuestion(id), undefined);
    assert.equal(demoNavigation.question(id), null);
  }
  assert.equal(isDemoRoute("/demo"), true);
  assert.equal(isDemoRoute("/demo/question/id"), true);
  assert.equal(isDemoRoute("/dashboard/demo"), false);
  assert.equal(isDemoRoute("/demonstration"), false);
});

test("genuine preview evidence uses V7 repository and marker metadata without browser storage access", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, get() { throw new Error("browser access forbidden"); } });
  try {
    const runtime = createDemoRuntime();
    assert.equal(await runtime.saveAttempt(input()), true);
    const recorded = runtime.getEvidence().attempts[0];
    assert.equal(recorded.answer, input().answer);
    assert.equal(recorded.strategy, input().strategy);
    assert.deepEqual(recorded.versionEvidence, { kind: "known", questionVersion: question.questionVersion });
    assert.equal(recorded.isGenuine, true);
    runtime.reset();
    assert.equal(runtime.getEvidence().attempts.length, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original); else Reflect.deleteProperty(globalThis, "window");
  }
});

test("attempt and support writes reject outside ownership and forged stage membership", async () => {
  const runtime = createDemoRuntime();
  assert.equal(await runtime.saveAttempt({ ...input(), questionId: "hm-calc-diff-basic-f-001" }), false);
  assert.equal(await runtime.saveAttempt({ ...input(), skillPathId: "basic-differentiation" }), false);
  assert.equal(await runtime.saveAttempt({ ...input(), stageId: "wrong" }), false);
  assert.equal(await runtime.saveAttempt({ ...input(), answer: "" }), false);
  assert.equal(await runtime.recordHint({ ...input(), stageId: "wrong" }), false);
  assert.equal(runtime.getEvidence().attempts.length, 0);
});

test("hint and solution support preserve existing genuine-attempt rules", async () => {
  const runtime = createDemoRuntime();
  assert.equal(await runtime.recordSolution(input()), false);
  assert.equal(await runtime.recordHint(input()), true);
  assert.equal(await runtime.recordHint(input()), false);
  await runtime.saveAttempt(input());
  assert.equal(runtime.getEvidence().attempts[0].hintViewedBeforeSubmission, true);
  assert.equal(await runtime.recordSolution(input()), true);
  assert.equal(runtime.getEvidence().supportEvents[1].afterGenuineAttempt, true);
});

test("preview guided self-assessment adapter is isolated and resettable when a real session supplies it", async () => {
  const runtime = createDemoRuntime();
  const event = { practiceSessionId: "preview-session", questionId: question.id,
    skillPathId: "chain-rule", stageId: question.stageId!, outcome: "unsure" as const,
    occurredAt: "2026-09-18T12:01:00.000Z" };
  assert.equal(await runtime.recordSelfAssessment(event), true);
  assert.equal(runtime.getEvidence().guidedSelfAssessments[0].outcome, "unsure");
  assert.equal(await runtime.recordSelfAssessment({ ...event, questionId: "hm-calc-diff-basic-f-001" }), false);
  runtime.reset();
  assert.equal(runtime.getEvidence().guidedSelfAssessments.length, 0);
});

test("drafts are bounded and disposable; reset clears only this runtime", async () => {
  const runtime = createDemoRuntime();
  const other = createDemoRuntime();
  runtime.saveDraft(identity, "x^2", true);
  other.saveDraft(identity, "other tab", false);
  await other.saveAttempt(input());
  await runtime.saveAttempt(input());
  assert.equal(runtime.acknowledgePath("chain-rule", "completed"), "recorded");
  assert.equal(runtime.acknowledgePath("chain-rule", "completed"), "unchanged");
  const unchangedOther = other.getEvidence();
  runtime.reset();
  assert.equal(runtime.acknowledgePath("chain-rule", "completed"), "recorded");
  assert.equal(runtime.loadDraft(identity), null);
  assert.deepEqual(runtime.getEvidence(), production.getEmptyProgressEvidence());
  assert.deepEqual(other.getEvidence(), unchangedOther);
  assert.equal(other.loadDraft(identity)?.kind, "plain");
});

test("production adapter delegates existing semantics without replacing global repositories", () => {
  assert.equal(productionLearningRuntime.getEvidence, production.getProgressEvidence);
  assert.equal(productionLearningRuntime.saveAttempt, production.saveQuestionAttempt);
  assert.equal(productionLearningRuntime.recordHint, production.recordHintViewed);
  assert.equal(productionLearningRuntime.recordSolution, production.recordWorkedSolutionViewed);
  assert.equal(productionLearningRuntime.recordSelfAssessment, production.recordGuidedSelfAssessment);
  assert.equal(productionLearningRuntime.kind, "production");
});

test("root isolation selects demo before production providers; middleware cannot resolve demo auth", () => {
  const boundary = readFileSync("components/runtime-boundary.tsx", "utf8");
  assert.ok(boundary.indexOf("if (isDemoRoute(pathname))") < boundary.indexOf("return <AuthFeatureProvider"));
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.ok(!layout.includes("<ProgressSyncProvider"));
  const middleware = readFileSync("middleware.ts", "utf8");
  assert.ok(middleware.includes('matcher: ["/account/:path*", "/auth/:path*"]'));
});

test("preview pathway contains only canonical content counts and demo-contained stage destinations", () => {
  const pathway = getDemoPathway();
  assert.deepEqual(pathway.map((stage) => stage.label), ["Notes", "Foundations", "Applications", "Exam practice"]);
  assert.deepEqual(pathway.map((stage) => stage.count), [null, 10, 9, 15]);
  assert.ok(pathway.every((stage) => stage.href.startsWith("/demo/")));
  for (const stage of pathway.slice(1)) assert.ok(getDemoQuestion(decodeURIComponent(stage.href.split("/").at(-1)!)));
});

test("preview orientation presentation never imports production learner hooks", () => {
  const files = ["components/demo/demo-foundation.tsx", "components/demo/demo-pathway.tsx", "components/demo/demo-shell.tsx",
    "app/demo/layout.tsx", "app/demo/chain-rule/notes/page.tsx"];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const forbidden of ["@/lib/local-progress", "@/components/working-context", "@/components/learner-preferences",
      "@/components/account", "@/components/premium", "@/components/layout/app-shell", "@/components/questions/question-workspace",
      "useLearnerNextAction", "window.localStorage", "window.sessionStorage", "saveAttempt(", "saveDraft("]) {
      assert.ok(!source.includes(forbidden), `${file} contains ${forbidden}`);
    }
  }
});

function sampleInput(id: string, answer: string) {
  const question = getDemoQuestion(id)!.question;
  const result = markQuestionAnswer(question, answer);
  return { questionId: id, skillPathId: "chain-rule", stageId: question.stageId!, answer,
    attemptedAt: "2026-09-18T12:00:00.000Z", isCorrect: result.isCorrect,
    outcomeKind: result.outcomeKind as "graded" | "malformed" | "unmarkable", strategy: result.strategy, strategyVersion: result.strategyVersion };
}

test("canonical walkthrough uses one concise real question per stage", () => {
  assert.deepEqual(WALKTHROUGH_IDS.map((id) => getDemoQuestion(id)!.stage.name), ["Foundations", "Applications", "Past Paper-style Questions"]);
  assert.deepEqual(WALKTHROUGH_IDS.map((id) => previewQuestionAction(id).label), ["Sample Applications", "Sample Exam practice", "Return to Preview Dashboard"]);
  assert.ok(getDemoQuestions().every((question) => previewQuestionAction(question.id).href.startsWith("/demo")));
});

test("walkthrough continuation is derived from genuine evidence, never mastery or a parallel cursor", async () => {
  const runtime = createDemoRuntime();
  assert.equal(previewContinueHref(runtime.getEvidence()), demoNavigation.skill);
  assert.equal(hasPreviewInteraction(runtime.getEvidence()), false);
  for (const [index, id] of WALKTHROUGH_IDS.entries()) {
    await runtime.saveAttempt(sampleInput(id, getDemoQuestion(id)!.question.correctAnswer));
    assert.equal(previewContinueHref(runtime.getEvidence()), index < 2 ? demoNavigation.question(WALKTHROUGH_IDS[index + 1]) : demoNavigation.skill);
  }
  const progress = runtime.getSkillProgress(getDemoSkill()!.skillPath);
  assert.equal(progress.completedQuestionIds.length, 3);
  assert.equal(progress.status, "in_progress");
  for (const stage of Object.values(progress.stageProgress)) {
    assert.equal(stage.completedQuestionIds.length, 1);
    assert.equal(stage.status, "in_progress");
    assert.ok(stage.completionPercentage < 100);
  }
  assert.equal(runtime.getEvidence().achievementSnapshots.length, 0);
  runtime.reset();
  assert.equal(runtime.resetVersion, 1);
  assert.equal(previewContinueHref(runtime.getEvidence()), demoNavigation.skill);
});

test("wrong then correct, hint-assisted and solution-assisted outcomes retain real semantics", async () => {
  const runtime = createDemoRuntime();
  const id = WALKTHROUGH_IDS[0];
  await runtime.saveAttempt(sampleInput(id, "1"));
  assert.match(previewOutcomeLabel(runtime.getQuestionProgress(id)), /not yet correct/);
  await runtime.saveAttempt(sampleInput(id, "15(3x+2)^4"));
  assert.equal(runtime.getQuestionProgress(id).bestOutcome, "independently_correct_after_error");
  assert.equal(previewOutcomeLabel(runtime.getQuestionProgress(id)), "Correct after error");
  runtime.reset();
  await runtime.recordHint(sampleInput(id, "1"));
  assert.equal(previewContinueHref(runtime.getEvidence()), demoNavigation.question(WALKTHROUGH_IDS[1]));
  await runtime.saveAttempt(sampleInput(id, "15(3x+2)^4"));
  assert.equal(runtime.getQuestionProgress(id).bestOutcome, "correct_with_hint");
  assert.equal(previewOutcomeLabel(runtime.getQuestionProgress(id)), "Correct with hint");
  runtime.reset();
  await runtime.saveAttempt(sampleInput(id, "1"));
  await runtime.recordSolution(sampleInput(id, "1"));
  assert.equal(runtime.getQuestionProgress(id).bestOutcome, "completed_with_solution");
  assert.equal(previewOutcomeLabel(runtime.getQuestionProgress(id)), "Solution used");
});

test("marker equivalents, malformed, unsupported and internal outcomes are honest", async () => {
  const question = getDemoQuestion(WALKTHROUGH_IDS[1])!.question;
  assert.equal(markQuestionAnswer(question, "2000/2").isCorrect, true);
  assert.equal(markQuestionAnswer(question, "1001").isCorrect, false);
  const malformed = markQuestionAnswer(question, "((");
  const unsupported = markQuestionAnswer(question, "sin(1)");
  for (const result of [malformed, unsupported]) {
    assert.notEqual(result.outcomeKind, "graded");
    assert.equal(result.isCorrect, null);
  }
  const internal = classifyAnswerFeedback(question, "1000", { ...markQuestionAnswer(question, "1000"), isCorrect: null, outcomeKind: "internal_error" });
  assert.equal(internal.category, "internal_error");
  assert.equal(internal.shouldRecordAttempt, false);
});

test("shared Workspace routes every persistence operation through the runtime", () => {
  const source = readFileSync("components/questions/question-workspace.tsx", "utf8");
  for (const operation of ["getSkillProgress", "getQuestionProgress", "getEvidence", "saveAttempt", "loadDraft", "saveDraft", "clearDraft", "recordHint", "recordSolution", "recordSelfAssessment", "acknowledgePath", "acknowledgeStage", "subscribe"]) {
    assert.ok(source.includes(`runtime.${operation}`), operation);
  }
  assert.ok(!source.includes("browserStorage"));
  assert.ok(!source.includes("getProgressEvidence("));
  const entry = readFileSync("components/demo/demo-question-workspace.tsx", "utf8");
  assert.ok(entry.includes("runtime={runtime}"));
  assert.ok(entry.includes("useDemoRuntime()"));
});
