import type { ContentRevision, QuestionVersion } from "@/data/types";
import type { StorageLike } from "@/lib/progress/storage";

export const ANSWER_DRAFT_STORAGE_KEY = "stemforge.answerDrafts.v1";
export const ANSWER_DRAFT_SCHEMA_VERSION = 1 as const;
export const MAX_DRAFT_LENGTH = 4_096;
export const MAX_DRAFT_COUNT = 50;

export type AnswerDraftIdentity = {
  questionId: string;
  questionVersion: QuestionVersion;
  contentRevision: ContentRevision;
};

export type AnswerDraft = AnswerDraftIdentity & {
  answer: string;
  updatedAt: string;
};

type AnswerDraftPayload = {
  version: typeof ANSWER_DRAFT_SCHEMA_VERSION;
  drafts: Record<string, AnswerDraft>;
};

export function createAnswerDraftKey(identity: AnswerDraftIdentity) {
  return `${encodeURIComponent(identity.questionId)}:q${identity.questionVersion}:r${identity.contentRevision}`;
}

export function loadAnswerDraft(storage: StorageLike | null, identity: AnswerDraftIdentity): AnswerDraft | null {
  const payload = readPayload(storage);
  const candidate = payload.drafts[createAnswerDraftKey(identity)];
  return isDraft(candidate) && sameIdentity(candidate, identity) ? candidate : null;
}

export function saveAnswerDraft(
  storage: StorageLike | null,
  identity: AnswerDraftIdentity,
  answer: string,
  updatedAt = new Date().toISOString(),
) {
  if (!storage) return false;
  const trimmed = answer.trim();
  if (!trimmed) return clearAnswerDraft(storage, identity);
  const payload = readPayload(storage);
  const key = createAnswerDraftKey(identity);
  payload.drafts[key] = { ...identity, answer: answer.slice(0, MAX_DRAFT_LENGTH), updatedAt };
  payload.drafts = Object.fromEntries(
    Object.entries(payload.drafts)
      .filter(([, draft]) => isDraft(draft))
      .sort(([, left], [, right]) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_DRAFT_COUNT),
  );
  return writePayload(storage, payload);
}

export function clearAnswerDraft(storage: StorageLike | null, identity: AnswerDraftIdentity) {
  if (!storage) return false;
  const payload = readPayload(storage);
  delete payload.drafts[createAnswerDraftKey(identity)];
  return writePayload(storage, payload);
}

function emptyPayload(): AnswerDraftPayload {
  return { version: ANSWER_DRAFT_SCHEMA_VERSION, drafts: {} };
}

function readPayload(storage: StorageLike | null): AnswerDraftPayload {
  if (!storage) return emptyPayload();
  try {
    const raw = storage.getItem(ANSWER_DRAFT_STORAGE_KEY);
    if (!raw) return emptyPayload();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== ANSWER_DRAFT_SCHEMA_VERSION || !isRecord(parsed.drafts)) return emptyPayload();
    return { version: ANSWER_DRAFT_SCHEMA_VERSION, drafts: { ...parsed.drafts } as Record<string, AnswerDraft> };
  } catch {
    return emptyPayload();
  }
}

function writePayload(storage: StorageLike, payload: AnswerDraftPayload) {
  try {
    storage.setItem(ANSWER_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function isDraft(value: unknown): value is AnswerDraft {
  return isRecord(value)
    && typeof value.questionId === "string"
    && Number.isInteger(value.questionVersion) && (value.questionVersion as number) > 0
    && Number.isInteger(value.contentRevision) && (value.contentRevision as number) > 0
    && typeof value.answer === "string" && value.answer.length <= MAX_DRAFT_LENGTH
    && typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt));
}

function sameIdentity(left: AnswerDraftIdentity, right: AnswerDraftIdentity) {
  return left.questionId === right.questionId
    && left.questionVersion === right.questionVersion
    && left.contentRevision === right.contentRevision;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
