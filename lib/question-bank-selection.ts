export const QUESTION_BANK_PAGE_SIZE = 24;

export type QuestionBankFilters = {
  courseAreaId: string;
  specAreaId: string;
  skillPathId: string;
  stageId: string;
};

export function normalizeQuestionBankFilters(
  filters: QuestionBankFilters,
  available: {
    specAreas: readonly { id: string; courseAreaId: string }[];
    skillPaths: readonly { id: string; specAreaId: string; courseAreaId: string }[];
    stages: readonly { id: string; skillPathId: string }[];
  },
): QuestionBankFilters {
  const specAreaId = available.specAreas.some((item) => item.id === filters.specAreaId && (!filters.courseAreaId || item.courseAreaId === filters.courseAreaId))
    ? filters.specAreaId : "";
  const skillPathId = available.skillPaths.some((item) =>
    item.id === filters.skillPathId
    && (!filters.courseAreaId || item.courseAreaId === filters.courseAreaId)
    && (!specAreaId || item.specAreaId === specAreaId))
    ? filters.skillPathId : "";
  const stageId = available.stages.some((item) => {
    if (item.id !== filters.stageId || (skillPathId && item.skillPathId !== skillPathId)) return false;
    const parentPath = available.skillPaths.find((path) => path.id === item.skillPathId);
    return Boolean(parentPath)
      && (!filters.courseAreaId || parentPath?.courseAreaId === filters.courseAreaId)
      && (!specAreaId || parentPath?.specAreaId === specAreaId);
  }) ? filters.stageId : "";
  return { courseAreaId: filters.courseAreaId, specAreaId, skillPathId, stageId };
}

export function toggleQuestionSelection(selected: ReadonlySet<string>, questionId: string, checked: boolean) {
  const next = new Set(selected);
  if (checked) next.add(questionId);
  else next.delete(questionId);
  return next;
}

export function setQuestionGroupSelection(selected: ReadonlySet<string>, questionIds: readonly string[], checked: boolean) {
  const next = new Set(selected);
  for (const id of questionIds) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}

export function retainAvailableSelections(selected: ReadonlySet<string>, availableQuestionIds: readonly string[]) {
  const available = new Set(availableQuestionIds);
  return new Set([...selected].filter((id) => available.has(id)));
}

export function paginateQuestionIds(questionIds: readonly string[], page: number, pageSize = QUESTION_BANK_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(questionIds.length / pageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page || 1)), pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    page: currentPage,
    pageCount,
    total: questionIds.length,
    start: questionIds.length ? start + 1 : 0,
    end: Math.min(start + pageSize, questionIds.length),
    questionIds: questionIds.slice(start, start + pageSize),
  };
}
