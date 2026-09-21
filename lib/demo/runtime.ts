import { createDefaultProgressPayload } from "@/lib/progress/payload";
import { ProgressRepository } from "@/lib/progress/repository";
import { calculateSkillPathProgress, getQuestionProgressForVersion, isGenuineAnswer } from "@/lib/progress/calculations";
import { createEventId } from "@/lib/progress/event-identity";
import { wasHintViewedBeforeSubmission } from "@/lib/progress/hint-evidence";
import type { ProgressStorage, StorageLike } from "@/lib/progress/storage";
import type { ProgressPayload } from "@/lib/progress/types";
import { LocalStorageCelebrationStorage, STAGE_CELEBRATION_STORAGE_KEY } from "@/lib/completion-tracking";
import { loadAnswerDraft, saveAnswerDraft, saveRichMathAnswerDraft, clearAnswerDraft } from "@/lib/questions/answer-drafts";
import type { LearningRuntime } from "@/lib/learning/runtime";
import { demoNavigation, getDemoQuestion, getDemoQuestions, getDemoSkill } from "@/lib/demo/content";

/** Per-provider, per-tab memory only. Never receives browser storage or an account owner. */
export function createDemoRuntime(): LearningRuntime & { reset(): void } {
  let payload = createDefaultProgressPayload();
  let resetVersion = 0;
  const listeners = new Set<() => void>();
  const draftValues = new Map<string, string>();
  const emit = () => listeners.forEach((listener) => listener());
  const storage: ProgressStorage = {
    load: () => ({ payload: structuredClone(payload), status: "current", droppedAttempts: 0, droppedEvents: 0,
      droppedSelfAssessments: 0, droppedSnapshots: 0, droppedReviewEvents: 0, droppedFlashcardReviews: 0 }),
    save: (value: ProgressPayload) => { payload = structuredClone(value); emit(); return true; },
    clear: () => { payload = createDefaultProgressPayload(); emit(); return true; },
  };
  const repository = new ProgressRepository(storage);
  // Reuse draft validation/limits against a private map, never window.localStorage.
  const draftStorage: StorageLike = {
    getItem: (key) => draftValues.get(key) ?? null,
    setItem: (key, value) => { draftValues.set(key, value); },
    removeItem: (key) => { draftValues.delete(key); },
  };
  const pathAcknowledgements = new LocalStorageCelebrationStorage(draftStorage);
  const stageAcknowledgements = new LocalStorageCelebrationStorage(draftStorage, STAGE_CELEBRATION_STORAGE_KEY);
  const versions = Object.fromEntries(getDemoQuestions().map((question) => [question.id, question.questionVersion]));
  function scope(input: { questionId: string; skillPathId: string; stageId: string }) {
    const context = getDemoQuestion(input.questionId);
    return context && input.skillPathId === context.skillPath.slug && input.stageId === context.stage.id ? context : undefined;
  }
  function sequence() {
    const evidence = repository.getEvidence();
    return Math.max(0, ...evidence.attempts.map((event) => event.sequence), ...evidence.supportEvents.map((event) => event.sequence),
      ...evidence.guidedSelfAssessments.map((event) => event.sequence)) + 1;
  }
  function structuralContext() {
    const context = getDemoSkill();
    return context ? { subjectId: context.subject.subjectSlug, courseId: context.courseArea.slug,
      skillPath: context.skillPath, questionVersions: versions } : undefined;
  }
  async function support(type: "hint_viewed" | "solution_viewed", input: Parameters<LearningRuntime["recordHint"]>[0]) {
    const context = scope(input);
    if (!context) return false;
    const evidence = repository.getEvidence();
    const versionEvidence = { kind: "known" as const, questionVersion: context.question.questionVersion };
    const afterGenuineAttempt = evidence.attempts.some((attempt) => attempt.questionId === input.questionId && attempt.isGenuine
      && attempt.versionEvidence.questionVersion === versionEvidence.questionVersion);
    if (type === "solution_viewed" && !afterGenuineAttempt) return false;
    if (evidence.supportEvents.some((event) => event.questionId === input.questionId && event.type === type
      && event.practiceSessionId === input.practiceSessionId && event.versionEvidence.questionVersion === versionEvidence.questionVersion)) return false;
    return repository.recordSupportEvent({ questionId: input.questionId, skillPathId: input.skillPathId, stageId: input.stageId,
      ...(input.practiceSessionId ? { practiceSessionId: input.practiceSessionId } : {}),
      type, occurredAt: input.attemptedAt, sequence: sequence(), afterGenuineAttempt, versionEvidence, eventId: createEventId("support") }, structuralContext());
  }
  return {
    kind: "demo", navigation: demoNavigation,
    get resetVersion() { return resetVersion; },
    getEvidence: () => repository.getEvidence(),
    getQuestionProgress(id) {
      const context = getDemoQuestion(id);
      if (!context) throw new Error("Unavailable preview question");
      return getQuestionProgressForVersion(id, context.question.questionVersion, repository.getEvidence(), "chain-rule");
    },
    getSkillProgress(skill) {
      const canonical = getDemoSkill()?.skillPath;
      if (skill.slug !== "chain-rule" || !canonical) throw new Error("Unavailable preview skill");
      return calculateSkillPathProgress(canonical, repository.getEvidence(), versions);
    },
    async saveAttempt(input) {
      const context = scope(input);
      if (!context || !isGenuineAnswer(input.answer)) return false;
      const evidence = repository.getEvidence();
      const versionEvidence = { kind: "known" as const, questionVersion: context.question.questionVersion };
      const nextSequence = sequence();
      return repository.recordAttempt({ ...input, sequence: nextSequence, isGenuine: true,
        hintViewedBeforeSubmission: wasHintViewedBeforeSubmission(evidence, input.questionId, versionEvidence, input.attemptedAt, nextSequence),
        supportKnowledge: "known", versionEvidence, eventId: createEventId("attempt") }, structuralContext());
    },
    recordHint: (input) => support("hint_viewed", input),
    recordSolution: (input) => support("solution_viewed", input),
    async recordSelfAssessment(input) {
      const context = scope(input);
      if (!context || !input.practiceSessionId.trim()) return false;
      return repository.recordGuidedSelfAssessment({ ...input, sequence: sequence(), eventId: createEventId("self_assessment"),
        versionEvidence: { kind: "known", questionVersion: context.question.questionVersion } });
    },
    loadDraft: (identity) => getDemoQuestion(identity.questionId) ? loadAnswerDraft(draftStorage, identity) : null,
    saveDraft: (identity, value, rich) => Boolean(getDemoQuestion(identity.questionId)) && (rich
      ? saveRichMathAnswerDraft(draftStorage, identity, value) : saveAnswerDraft(draftStorage, identity, value)),
    clearDraft: (identity) => Boolean(getDemoQuestion(identity.questionId)) && clearAnswerDraft(draftStorage, identity),
    acknowledgePath: (id, status) => id === "chain-rule" ? pathAcknowledgements.recordCompletion(id, status) : "unchanged",
    acknowledgeStage: (id, stageId, status) => id === "chain-rule" && getDemoSkill()?.skillPath.learningStages?.some((stage) => stage.id === stageId)
      ? stageAcknowledgements.recordCompletion(`${id}:${stageId}`, status) : "unchanged",
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reset() { resetVersion += 1; draftValues.clear(); repository.clear(); },
  };
}
