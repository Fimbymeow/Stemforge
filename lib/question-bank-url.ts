import type { AnswerType } from "@/data/types";
import type { QuestionBankCalculatorFilter, QuestionBankProgressFilter, QuestionBankSort, QuestionBankTypeFilter } from "@/lib/question-bank-query";
import type { QuestionBankFilters } from "@/lib/question-bank-selection";

export type QuestionBankUrlState = QuestionBankFilters & {
  status: QuestionBankProgressFilter;
  type: QuestionBankTypeFilter;
  calc: QuestionBankCalculatorFilter;
  sort: QuestionBankSort;
  page: number;
};

export const QUESTION_BANK_URL_DEFAULTS: QuestionBankUrlState = {
  courseAreaId: "",
  specAreaId: "",
  skillPathIds: [],
  stageIds: [],
  status: "all",
  type: "all",
  calc: "all",
  sort: "default",
  page: 1,
};

const PARAM_NAMES = {
  courseAreaId: "course",
  specAreaId: "spec",
  skillPathIds: "path",
  stageIds: "stage",
  status: "status",
  type: "type",
  calc: "calc",
  sort: "sort",
  page: "page",
} as const satisfies Record<keyof QuestionBankUrlState, string>;

const STATUS_VALUES: readonly QuestionBankProgressFilter[] = ["all", "not-started", "in-progress", "completed", "review-recommended", "previously-incorrect"];
const SORT_VALUES: readonly QuestionBankSort[] = ["default", "recently-practised", "review-priority", "completion-status"];
const CALC_VALUES: readonly QuestionBankCalculatorFilter[] = ["all", "allowed", "not-allowed"];
const TYPE_VALUES: readonly QuestionBankTypeFilter[] = [
  "all",
  "multiple_choice",
  "numerical",
  "algebraic",
  "written",
  "multi_step",
  "graph_structured",
  "nature_table",
] satisfies Array<"all" | AnswerType>;

function readEnum<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const raw = params.get(key);
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

function readSlug(params: URLSearchParams, key: string): string {
  return params.get(key)?.trim() ?? "";
}

function readSlugs(params: URLSearchParams, key: string): string[] {
  return [...new Set((params.get(key) ?? "").split(",").map((value) => value.trim()).filter(Boolean))];
}

/** Context-free parse: validates enum/page shape only. Cascade validity (course/spec/path/stage) is resolved separately once real filter options are known. */
export function parseQuestionBankSearchParams(params: URLSearchParams): QuestionBankUrlState {
  const rawPage = Number.parseInt(params.get(PARAM_NAMES.page) ?? "", 10);
  return {
    courseAreaId: readSlug(params, PARAM_NAMES.courseAreaId),
    specAreaId: readSlug(params, PARAM_NAMES.specAreaId),
    skillPathIds: readSlugs(params, PARAM_NAMES.skillPathIds),
    stageIds: readSlugs(params, PARAM_NAMES.stageIds),
    status: readEnum(params, PARAM_NAMES.status, STATUS_VALUES, QUESTION_BANK_URL_DEFAULTS.status),
    type: readEnum(params, PARAM_NAMES.type, TYPE_VALUES, QUESTION_BANK_URL_DEFAULTS.type),
    calc: readEnum(params, PARAM_NAMES.calc, CALC_VALUES, QUESTION_BANK_URL_DEFAULTS.calc),
    sort: readEnum(params, PARAM_NAMES.sort, SORT_VALUES, QUESTION_BANK_URL_DEFAULTS.sort),
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : QUESTION_BANK_URL_DEFAULTS.page,
  };
}

/** Serializes canonical state to search params, omitting anything equal to its default. */
export function serializeQuestionBankUrlState(state: QuestionBankUrlState): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(PARAM_NAMES) as Array<keyof QuestionBankUrlState>).forEach((key) => {
    const value = state[key];
    if (Array.isArray(value)) {
      if (!value.length) return;
      params.set(PARAM_NAMES[key], value.join(","));
      return;
    }
    if (value === QUESTION_BANK_URL_DEFAULTS[key]) return;
    params.set(PARAM_NAMES[key], String(value));
  });
  return params;
}

export function questionBankSearchString(state: QuestionBankUrlState): string {
  const query = serializeQuestionBankUrlState(state).toString();
  return query ? `?${query}` : "";
}
