import { courseCatalog } from "@/data/subjects";
import { contentResolver } from "@/lib/content-resolver";
import type { ProgressEvidence } from "@/lib/progress/types";

export const LEARNER_PREFERENCES_VERSION = 1 as const;
export const LEARNER_PREFERENCES_STORAGE_KEY = "orthic.learnerPreferences.v1";
export const LEARNER_PREFERENCES_UPDATED_EVENT = "orthic:learner-preferences-updated";
export const MAX_FIRST_NAME_LENGTH = 40;

export type LearnerPreferences = {
  version: typeof LEARNER_PREFERENCES_VERSION;
  firstName: string | null;
  namePromptDismissed: boolean;
  selectedCourseSlugs: string[];
};

export type LearnerCourse = {
  slug: string;
  name: string;
  href: string;
};

export function emptyLearnerPreferences(): LearnerPreferences {
  return { version: LEARNER_PREFERENCES_VERSION, firstName: null, namePromptDismissed: false, selectedCourseSlugs: [] };
}

export function normalizeFirstName(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_FIRST_NAME_LENGTH) : null;
}

export function normalizeLearnerPreferences(value: unknown): LearnerPreferences {
  if (!value || typeof value !== "object") return emptyLearnerPreferences();
  const candidate = value as Partial<LearnerPreferences>;
  return {
    version: LEARNER_PREFERENCES_VERSION,
    firstName: normalizeFirstName(candidate.firstName),
    namePromptDismissed: candidate.namePromptDismissed === true,
    selectedCourseSlugs: validCourseSlugs(candidate.selectedCourseSlugs),
  };
}

export function parseStoredLearnerPreferences(raw: string | null) {
  if (!raw) return emptyLearnerPreferences();
  try {
    const candidate = JSON.parse(raw) as { version?: unknown };
    if (candidate.version !== LEARNER_PREFERENCES_VERSION) return emptyLearnerPreferences();
    return normalizeLearnerPreferences(candidate);
  } catch {
    return emptyLearnerPreferences();
  }
}

export function readGuestLearnerPreferences(storage: Pick<Storage, "getItem">) {
  try {
    return parseStoredLearnerPreferences(storage.getItem(LEARNER_PREFERENCES_STORAGE_KEY));
  } catch {
    return emptyLearnerPreferences();
  }
}

export function writeGuestLearnerPreferences(storage: Pick<Storage, "setItem">, preferences: LearnerPreferences) {
  try {
    storage.setItem(LEARNER_PREFERENCES_STORAGE_KEY, JSON.stringify(normalizeLearnerPreferences(preferences)));
    return true;
  } catch {
    return false;
  }
}

export function clearGuestLearnerPreferences(storage: Pick<Storage, "removeItem">) {
  try {
    storage.removeItem(LEARNER_PREFERENCES_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function availableLearnerCourses(): LearnerCourse[] {
  return courseCatalog.filter((course) => course.available).map((course) => ({ slug: course.slug, name: course.name, href: course.href }));
}

export function resolveEffectiveCourseSlugs(input: {
  preferences: LearnerPreferences;
  evidence: ProgressEvidence;
  availableCourses?: readonly LearnerCourse[];
}) {
  const courses = input.availableCourses ?? availableLearnerCourses();
  const available = new Set(courses.map((course) => course.slug));
  const selected = input.preferences.selectedCourseSlugs.filter((slug) => available.has(slug));
  const progressed = courseSlugsWithProgress(input.evidence).filter((slug) => available.has(slug));
  const resolved = unique([...selected, ...progressed]);
  if (resolved.length > 0) return resolved;
  return courses.length === 1 ? [courses[0].slug] : [];
}

export function resolveEffectiveCourses(input: {
  preferences: LearnerPreferences;
  evidence: ProgressEvidence;
  availableCourses?: readonly LearnerCourse[];
}) {
  const courses = input.availableCourses ?? availableLearnerCourses();
  const selected = new Set(resolveEffectiveCourseSlugs({ ...input, availableCourses: courses }));
  return courses.filter((course) => selected.has(course.slug));
}

export function mergeGuestLearnerPreferences(remote: LearnerPreferences | null, guest: LearnerPreferences) {
  const normalizedGuest = normalizeLearnerPreferences(guest);
  if (!remote) return normalizedGuest;
  const normalizedRemote = normalizeLearnerPreferences(remote);
  return {
    version: LEARNER_PREFERENCES_VERSION,
    firstName: normalizedRemote.firstName ?? normalizedGuest.firstName,
    namePromptDismissed: normalizedRemote.namePromptDismissed,
    selectedCourseSlugs: validCourseSlugs([...normalizedRemote.selectedCourseSlugs, ...normalizedGuest.selectedCourseSlugs]),
  } satisfies LearnerPreferences;
}

export function hasMeaningfulGuestPreferences(preferences: LearnerPreferences) {
  return preferences.firstName !== null || preferences.namePromptDismissed || preferences.selectedCourseSlugs.length > 0;
}

function courseSlugsWithProgress(evidence: ProgressEvidence) {
  const fromSnapshots = evidence.achievementSnapshots.map((snapshot) => snapshot.subjectId);
  const pathIds = [
    ...evidence.attempts.map((attempt) => attempt.skillPathId),
    ...evidence.supportEvents.map((event) => event.skillPathId),
    ...evidence.guidedSelfAssessments.map((event) => event.skillPathId),
    ...evidence.reviewEvents.filter((event) => event.target.targetType === "skill").map((event) => event.target.targetId),
  ];
  const fromPaths = pathIds.flatMap((pathId) => {
    const context = contentResolver.getPathContext(pathId);
    return context ? [context.subject.subjectSlug] : [];
  });
  return unique([...fromSnapshots, ...fromPaths]);
}

function validCourseSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];
  const available = new Set(availableLearnerCourses().map((course) => course.slug));
  return unique(value.filter((slug): slug is string => typeof slug === "string" && available.has(slug)));
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}
