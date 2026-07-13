import { recordQuestionSubmission, recordSupportEvent, resetPathProgress } from "@/lib/progress/calculations";
import { appendAchievementTransitions, type StructuralAchievementContext } from "@/lib/progress/achievements";
import { createEventId, type EventIdFactory } from "@/lib/progress/event-identity";
import type { ProgressStorage } from "@/lib/progress/storage";
import type { ProgressLoadResult, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";

export class ProgressRepository {
  constructor(private readonly storage: ProgressStorage, private readonly idFactory: EventIdFactory = createEventId) {}

  load(): ProgressLoadResult {
    return this.storage.load();
  }

  getAttempts() {
    return this.load().payload.data.attempts;
  }

  getEvidence() {
    return this.load().payload.data;
  }

  recordAttempt(attempt: QuestionAttempt, context?: StructuralAchievementContext) {
    const loaded = this.load();
    if (!canWriteLoadedProgress(loaded)) return false;
    const updated = recordQuestionSubmission(loaded.payload, attempt);
    const data = context
      ? appendAchievementTransitions(loaded.payload.data, updated.data, context, attempt.attemptedAt, this.idFactory)
      : updated.data;
    return this.storage.save({ ...updated, data });
  }

  recordSupportEvent(event: QuestionSupportEvent, context?: StructuralAchievementContext) {
    const loaded = this.load();
    if (!canWriteLoadedProgress(loaded)) return false;
    const updated = recordSupportEvent(loaded.payload, event);
    const data = context
      ? appendAchievementTransitions(loaded.payload.data, updated.data, context, event.occurredAt, this.idFactory)
      : updated.data;
    return this.storage.save({ ...updated, data });
  }

  resetPath(skillPathId: string) {
    const loaded = this.load();
    if (!canWriteLoadedProgress(loaded)) return false;
    return this.storage.save(resetPathProgress(loaded.payload, skillPathId));
  }

  clear() {
    return this.storage.clear();
  }
}

function canWriteLoadedProgress(result: ProgressLoadResult) {
  return result.status !== "unsupported-version" && result.status !== "unavailable";
}
