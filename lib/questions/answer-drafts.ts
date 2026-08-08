import type { ContentRevision, QuestionVersion } from "@/data/types";
import type { StorageLike } from "@/lib/progress/storage";

export const ANSWER_DRAFT_STORAGE_KEY = "stemforge.answerDrafts.v1";
export const ANSWER_DRAFT_SCHEMA_VERSION = 2 as const;
export const RICH_MATH_DRAFT_SOURCE_FORMAT = "mathlive-latex-v1" as const;
export const MAX_DRAFT_LENGTH = 4_096;
export const MAX_DRAFT_COUNT = 50;

export type AnswerDraftIdentity = {
  questionId: string;
  questionVersion: QuestionVersion;
  contentRevision: ContentRevision;
};

type DraftBase = AnswerDraftIdentity & { updatedAt: string };
export type PlainAnswerDraft = DraftBase & { kind: "plain"; answer: string };
export type RichMathAnswerDraft = DraftBase & { kind: "rich-math"; sourceFormat: typeof RICH_MATH_DRAFT_SOURCE_FORMAT; source: string };
export type AnswerDraft = PlainAnswerDraft | RichMathAnswerDraft;

type AnswerDraftPayload = {
  version: typeof ANSWER_DRAFT_SCHEMA_VERSION;
  drafts: Record<string, AnswerDraft>;
};

export function createAnswerDraftKey(identity: AnswerDraftIdentity) {
  return `${encodeURIComponent(identity.questionId)}:q${identity.questionVersion}:r${identity.contentRevision}`;
}

export function loadAnswerDraft(storage: StorageLike | null, identity: AnswerDraftIdentity): AnswerDraft | null {
  const candidate = readPayload(storage).drafts[createAnswerDraftKey(identity)];
  return isDraft(candidate) && sameIdentity(candidate, identity) ? candidate : null;
}

export function saveAnswerDraft(storage: StorageLike | null, identity: AnswerDraftIdentity, answer: string, updatedAt = new Date().toISOString()) {
  return saveDraft(storage, identity, answer, { ...identity, kind: "plain", answer: answer.slice(0, MAX_DRAFT_LENGTH), updatedAt });
}

export function saveRichMathAnswerDraft(storage: StorageLike | null, identity: AnswerDraftIdentity, source: string, updatedAt = new Date().toISOString()) {
  return saveDraft(storage, identity, source, {
    ...identity,
    kind: "rich-math",
    sourceFormat: RICH_MATH_DRAFT_SOURCE_FORMAT,
    source: source.slice(0, MAX_DRAFT_LENGTH),
    updatedAt,
  });
}

function saveDraft(storage: StorageLike | null, identity: AnswerDraftIdentity, content: string, draft: AnswerDraft) {
  if (!storage) return false;
  if (!content.trim()) return clearAnswerDraft(storage, identity);
  const payload = readPayload(storage);
  payload.drafts[createAnswerDraftKey(identity)] = draft;
  payload.drafts = Object.fromEntries(
    Object.entries(payload.drafts)
      .filter(([, candidate]) => isDraft(candidate))
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
    if (!isRecord(parsed) || !isRecord(parsed.drafts)) return emptyPayload();
    if (parsed.version === ANSWER_DRAFT_SCHEMA_VERSION) {
      return { version: ANSWER_DRAFT_SCHEMA_VERSION, drafts: { ...parsed.drafts } as Record<string, AnswerDraft> };
    }
    if (parsed.version === 1) {
      const drafts: Record<string, AnswerDraft> = {};
      for (const [key, candidate] of Object.entries(parsed.drafts)) {
        if (isLegacyDraft(candidate)) drafts[key] = { ...candidate, kind: "plain" };
      }
      return { version: ANSWER_DRAFT_SCHEMA_VERSION, drafts };
    }
    return emptyPayload();
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

function hasValidBase(value: unknown): value is DraftBase & Record<string, unknown> {
  return isRecord(value)
    && typeof value.questionId === "string"
    && Number.isInteger(value.questionVersion) && (value.questionVersion as number) > 0
    && Number.isInteger(value.contentRevision) && (value.contentRevision as number) > 0
    && typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt));
}

function isDraft(value: unknown): value is AnswerDraft {
  if (!hasValidBase(value)) return false;
  return value.kind === "plain"
    ? typeof value.answer === "string" && value.answer.length <= MAX_DRAFT_LENGTH
    : value.kind === "rich-math"
      && value.sourceFormat === RICH_MATH_DRAFT_SOURCE_FORMAT
      && typeof value.source === "string" && value.source.length <= MAX_DRAFT_LENGTH;
}

function isLegacyDraft(value: unknown): value is DraftBase & { answer: string } {
  return hasValidBase(value) && typeof value.answer === "string" && value.answer.length <= MAX_DRAFT_LENGTH;
}

function sameIdentity(left: AnswerDraftIdentity, right: AnswerDraftIdentity) {
  return left.questionId === right.questionId
    && left.questionVersion === right.questionVersion
    && left.contentRevision === right.contentRevision;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
