import type { StemForgeQuestion } from "@/data/questions";
import type {
  ContentResource,
  Flashcard,
  FormulaCard,
  LearningStage,
  NoteBlock,
  PracticeSet,
  Question,
  SkillPath,
  SpecificationStrand,
  Subject,
  WorkedExample,
} from "@/data/types";

export type ContentValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  locations: string[];
};

export type ContentValidationCounts = {
  subjects: number;
  courses: number;
  specAreas: number;
  specificationStrands: number;
  skillPaths: number;
  stages: number;
  questions: number;
  legacyQuestions: number;
  resources: number;
  activeSkillPaths: number;
  archivedSkillPaths: number;
  activeStages: number;
  archivedStages: number;
  activeQuestions: number;
  archivedQuestions: number;
  versionedQuestions: number;
  activeResources: number;
  archivedResources: number;
};

export type ContentValidationReport = {
  counts: ContentValidationCounts;
  issues: ContentValidationIssue[];
  errors: ContentValidationIssue[];
  warnings: ContentValidationIssue[];
};

export type ContentValidationInput = {
  subjects: Subject[];
  questions: Question[];
  legacyQuestions?: StemForgeQuestion[];
};

type IssueWriter = (
  severity: ContentValidationIssue["severity"],
  code: string,
  message: string,
  ...locations: string[]
) => void;

type SkillPathContext = {
  subject: Subject;
  courseName: string;
  specAreaName: string;
  specificationStrand: SpecificationStrand;
  skillPath: SkillPath;
  location: string;
};

type StageContext = SkillPathContext & {
  stage: LearningStage;
  location: string;
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_IDS = new Set(["admin", "new", "null", "root", "undefined", "unknown"]);
const AUTO_MARKED_TYPES = new Set<Question["answerType"]>(["algebraic", "multiple_choice", "numerical"]);

export function validateContent(input: ContentValidationInput): ContentValidationReport {
  const issues: ContentValidationIssue[] = [];
  const legacyQuestions = input.legacyQuestions ?? [];
  const counts: ContentValidationCounts = {
    subjects: input.subjects.length,
    courses: 0,
    specAreas: 0,
    specificationStrands: 0,
    skillPaths: 0,
    stages: 0,
    questions: input.questions.length,
    legacyQuestions: legacyQuestions.length,
    resources: 0,
    activeSkillPaths: 0,
    archivedSkillPaths: 0,
    activeStages: 0,
    archivedStages: 0,
    activeQuestions: 0,
    archivedQuestions: 0,
    versionedQuestions: 0,
    activeResources: 0,
    archivedResources: 0,
  };
  const declaredIds = new Map<string, string>();
  const skillPaths = new Map<string, SkillPathContext>();
  const stages = new Map<string, StageContext>();
  const questionReferences = new Map<string, string[]>();

  const issue: IssueWriter = (severity, code, message, ...locations) => {
    issues.push({ severity, code, message, locations });
  };

  function validateId(id: unknown, kind: string, location: string, uniquenessKey = `${kind}:${String(id)}`) {
    if (typeof id !== "string" || !id.trim()) {
      issue("error", "missing-id", `${kind} is missing a stable ID.`, location);
      return;
    }
    if (!ID_PATTERN.test(id)) issue("error", "invalid-id-format", `${kind} ID "${id}" must use lowercase kebab-case.`, location);
    if (RESERVED_IDS.has(id)) issue("error", "reserved-id", `${kind} ID "${id}" is reserved.`, location);
    const existing = declaredIds.get(uniquenessKey);
    if (existing) issue("error", "duplicate-id", `Duplicate ${kind.toLowerCase()} ID "${id}".`, existing, location);
    else declaredIds.set(uniquenessKey, location);
  }

  for (const subject of input.subjects) {
    const subjectLocation = `data/${subject.subjectSlug}.ts#subject`;
    validateId(subject.subjectSlug, "Subject", subjectLocation, `subject:${subject.subjectSlug}`);
    validateRequiredText(subject.subjectName, "Subject name", subjectLocation, issue);
    validateContentStatus(subject.contentStatus, "Subject", subject.subjectSlug, subjectLocation, issue);
    validateSiblingSlugs(subject.courseAreas.map((course) => course.slug), "course", subjectLocation, issue);
    counts.courses += subject.courseAreas.length;
    counts.stages += subject.learningStages.length;

    for (const stage of subject.learningStages) {
      validateStageShape(stage, `${subjectLocation}/stage:${stage.id}`, validateId, issue, "Subject compatibility stage");
      countLifecycle(stage.contentStatus, "stage", counts);
    }

    for (const course of subject.courseAreas) {
      const courseLocation = `${subjectLocation}/course:${course.slug}`;
      validateId(course.slug, "Course", courseLocation, `course:${subject.subjectSlug}:${course.slug}`);
      validateRequiredText(course.name, "Course name", courseLocation, issue);
      validateContentStatus(course.contentStatus, "Course", course.slug, courseLocation, issue);
      validateParentLifecycle(subject.contentStatus, course.contentStatus, "subject", subject.subjectSlug, "course", course.slug, subjectLocation, courseLocation, issue);
      const specificationStrands = course.specificationStrands ?? [];
      counts.specificationStrands += specificationStrands.length;
      const strandOrders = new Map<number, string>();
      for (const strand of specificationStrands) {
        const strandLocation = `${courseLocation}/specification-strand:${strand.id}`;
        validateId(strand.id, "Specification strand", strandLocation, `specification-strand:${subject.subjectSlug}:${course.slug}:${strand.id}`);
        validateRequiredText(strand.name, "Specification strand name", strandLocation, issue);
        validateRequiredText(strand.description, "Specification strand description", strandLocation, issue);
        validateRequiredText(strand.href, "Specification strand href", strandLocation, issue);
        validatePositiveInteger(strand.displayOrder, "displayOrder", "Specification strand", strand.id, strandLocation, issue, "invalid-strand-display-order");
        validateContentStatus(strand.contentStatus, "Specification strand", strand.id, strandLocation, issue);
        validateParentLifecycle(course.contentStatus, strand.contentStatus, "course", course.slug, "specification strand", strand.id, courseLocation, strandLocation, issue);
        const existingOrder = strandOrders.get(strand.displayOrder);
        if (existingOrder) issue("error", "duplicate-strand-display-order", `Specification strands "${existingOrder}" and "${strand.id}" share displayOrder ${String(strand.displayOrder)}.`, courseLocation);
        else strandOrders.set(strand.displayOrder, strand.id);
      }
      const pathOrdersByStrand = new Map<string, Map<number, string>>();
      validateSiblingSlugs(course.specAreas.map((specArea) => specArea.slug), "spec area", courseLocation, issue);
      counts.specAreas += course.specAreas.length;

      for (const specArea of course.specAreas) {
        const specLocation = `${courseLocation}/spec-area:${specArea.slug}`;
        validateId(specArea.slug, "Spec area", specLocation, `spec-area:${subject.subjectSlug}:${course.slug}:${specArea.slug}`);
        validateRequiredText(specArea.name, "Spec area name", specLocation, issue);
        validateContentStatus(specArea.contentStatus, "Spec area", specArea.slug, specLocation, issue);
        validateParentLifecycle(course.contentStatus, specArea.contentStatus, "course", course.slug, "spec area", specArea.slug, courseLocation, specLocation, issue);
        validateSiblingSlugs((specArea.skillPaths ?? []).map((path) => path.slug), "skill path", specLocation, issue);

        for (const skillPath of specArea.skillPaths ?? []) {
          const pathLocation = `${specLocation}/skill-path:${skillPath.slug}`;
          const specificationStrand = specificationStrands.find((strand) => strand.id === skillPath.specificationStrandId);
          validateId(skillPath.slug, "Skill path", pathLocation, `skill-path:${skillPath.slug}:v${String(skillPath.pathVersion)}`);
          validateRequiredText(skillPath.name, "Skill path name", pathLocation, issue);
          validatePositiveInteger(skillPath.pathVersion, "pathVersion", "Skill path", skillPath.slug, pathLocation, issue, "invalid-path-version");
          validateContentStatus(skillPath.contentStatus, "Skill path", skillPath.slug, pathLocation, issue);
          validateParentLifecycle(specArea.contentStatus, skillPath.contentStatus, "spec area", specArea.slug, "skill path", skillPath.slug, specLocation, pathLocation, issue);
          if (specificationStrands.length && !skillPath.specificationStrandId) {
            issue("error", "missing-specification-strand-reference", `Skill path "${skillPath.slug}" has no specificationStrandId.`, pathLocation);
          } else if (specificationStrands.length && !specificationStrand) {
            issue("error", "invalid-specification-strand-reference", `Skill path "${skillPath.slug}" references missing specification strand "${String(skillPath.specificationStrandId)}".`, pathLocation, courseLocation);
          }
          if (specificationStrand) {
            validateParentLifecycle(specificationStrand.contentStatus, skillPath.contentStatus, "specification strand", specificationStrand.id, "skill path", skillPath.slug, `${courseLocation}/specification-strand:${specificationStrand.id}`, pathLocation, issue);
            validatePositiveInteger(skillPath.displayOrder, "displayOrder", "Skill path", skillPath.slug, pathLocation, issue, "invalid-path-display-order");
            if (Number.isInteger(skillPath.displayOrder)) {
              const orders = pathOrdersByStrand.get(specificationStrand.id) ?? new Map<number, string>();
              const existingOrder = orders.get(skillPath.displayOrder as number);
              if (existingOrder) issue("error", "duplicate-path-display-order", `Skill paths "${existingOrder}" and "${skillPath.slug}" share displayOrder ${String(skillPath.displayOrder)} within specification strand "${specificationStrand.id}".`, pathLocation);
              else orders.set(skillPath.displayOrder as number, skillPath.slug);
              pathOrdersByStrand.set(specificationStrand.id, orders);
            }
          }
          countLifecycle(skillPath.contentStatus, "path", counts);
          counts.skillPaths += 1;
          counts.stages += skillPath.learningStages?.length ?? 0;
          counts.resources += countResources(skillPath);
          countResourceLifecycle(skillPath, counts);

          const existingPath = skillPaths.get(skillPath.slug);
          if (skillPath.contentStatus === "active" && existingPath) {
            issue("error", "multiple-active-path-versions", `Skill path "${skillPath.slug}" has more than one active version.`, existingPath.location, pathLocation);
          } else if (skillPath.contentStatus === "active" && specificationStrand) {
            skillPaths.set(skillPath.slug, { subject, courseName: course.name, specAreaName: specArea.name, specificationStrand, skillPath, location: pathLocation });
          }

          validateResources(skillPath, pathLocation, validateId, issue);

          for (const stage of skillPath.learningStages ?? []) {
            const stageLocation = `${pathLocation}/stage:${stage.id}`;
            validateStageShape(stage, stageLocation, validateId, issue, "Stage");
            countLifecycle(stage.contentStatus, "stage", counts);
            if (skillPath.contentStatus === "active" && stage.contentStatus === "archived") {
              issue("error", "active-path-includes-archived-stage", `Active skill path "${skillPath.slug}" includes archived stage "${stage.id}".`, pathLocation, stageLocation);
            }
            if (skillPath.contentStatus === "archived" && stage.contentStatus === "active") {
              issue("error", "archived-path-active-stage", `Archived skill path "${skillPath.slug}" includes active stage "${stage.id}".`, pathLocation, stageLocation);
            }
            const existingStage = stages.get(stage.id);
            if (stage.contentStatus === "active" && existingStage) issue("error", "multiple-active-stage-versions", `Stage "${stage.id}" has more than one active version.`, existingStage.location, stageLocation);
            else if (stage.contentStatus === "active" && specificationStrand) stages.set(stage.id, { subject, courseName: course.name, specAreaName: specArea.name, specificationStrand, skillPath, stage, location: stageLocation });

            for (const questionId of findDuplicates(stage.questionIds)) {
              issue("error", "duplicate-stage-question", `Stage "${stage.id}" contains question "${questionId}" more than once.`, stageLocation);
            }
            for (const questionId of stage.questionIds) {
              if (stage.contentStatus !== "active") continue;
              const references = questionReferences.get(questionId) ?? [];
              references.push(stageLocation);
              questionReferences.set(questionId, references);
            }
          }
        }
      }
    }
  }

  const questions = new Map<string, Array<{ question: Question; location: string }>>();
  const activeQuestions = new Map<string, { question: Question; location: string }>();
  const questionVersions = new Map<string, string>();
  for (const question of input.questions) {
    const location = questionLocation(question);
    validateId(question.id, "Question", location, `question:${question.id}:v${String(question.questionVersion)}`);
    validatePositiveInteger(question.questionVersion, "questionVersion", "Question", question.id, location, issue, "invalid-question-version");
    validatePositiveInteger(question.contentRevision, "contentRevision", "Question", question.id, location, issue, "invalid-content-revision");
    validateContentStatus(question.contentStatus, "Question", question.id, location, issue);
    const versionKey = `${question.id}:v${String(question.questionVersion)}`;
    const existingVersion = questionVersions.get(versionKey);
    if (existingVersion) {
      issue("error", "duplicate-question-version", `Question "${question.id}" version ${String(question.questionVersion)} is declared more than once.`, existingVersion, location);
      issue("error", "duplicate-question-id", `Duplicate question ID/version pair "${question.id}" v${String(question.questionVersion)}.`, existingVersion, location);
    }
    else questionVersions.set(versionKey, location);
    const versions = questions.get(question.id) ?? [];
    versions.push({ question, location });
    questions.set(question.id, versions);
    if (question.contentStatus === "active") {
      const existingActive = activeQuestions.get(question.id);
      if (existingActive) issue("error", "multiple-active-question-versions", `Question "${question.id}" has more than one active version.`, existingActive.location, location);
      else activeQuestions.set(question.id, { question, location });
      counts.activeQuestions += 1;
    } else if (question.contentStatus === "archived") counts.archivedQuestions += 1;
    if (Number.isInteger(question.questionVersion) && question.questionVersion > 0) counts.versionedQuestions += 1;
    validateQuestion(question, location, issue);
  }

  for (const [questionId, references] of questionReferences) {
    if (!questions.has(questionId)) issue("error", "missing-question-reference", `Stage references question "${questionId}", but that question does not exist.`, ...references);
    else if (!activeQuestions.has(questionId)) issue("error", "active-stage-references-archived-question", `Active stage references question "${questionId}", but it has no active version.`, ...references, ...(questions.get(questionId) ?? []).map((entry) => entry.location));
    if (references.length > 1) issue("error", "question-in-multiple-stages", `Question "${questionId}" is referenced by more than one canonical stage.`, ...references);
  }

  for (const { question, location } of activeQuestions.values()) {
    const path = question.skillPathId ? skillPaths.get(question.skillPathId) : undefined;
    const stage = question.stageId ? stages.get(question.stageId) : undefined;
    const references = questionReferences.get(question.id) ?? [];

    if (!question.skillPathId) issue("error", "missing-skill-path-reference", `Question "${question.id}" has no skillPathId.`, location);
    else if (!path) issue("error", "invalid-skill-path-reference", `Question "${question.id}" references missing skill path "${question.skillPathId}".`, location);
    if (!question.stageId) issue("error", "missing-stage-reference", `Question "${question.id}" has no stageId.`, location);
    else if (!stage) issue("error", "invalid-stage-reference", `Question "${question.id}" references missing stage "${question.stageId}".`, location);
    if (!references.length) issue("error", "orphan-question", `Question "${question.id}" is not referenced by any canonical stage.`, location);

    if (path) {
      compareReference(question.subject, path.subject.subjectName, "subject", question.id, location, issue);
      compareReference(question.courseArea, path.courseName, "course area", question.id, location, issue);
      compareReference(question.specArea, path.specAreaName, "spec area", question.id, location, issue);
      if (question.specificationStrandId && question.specificationStrandId !== path.specificationStrand.id) {
        issue("error", "specification-strand-mismatch", `Question "${question.id}" specificationStrandId is "${question.specificationStrandId}" but its path belongs to "${path.specificationStrand.id}".`, location, path.location);
      }
      if (question.skillPath) compareReference(question.skillPath, path.skillPath.name, "skill path name", question.id, location, issue);
    }
    if (stage) {
      compareReference(question.stage, stage.stage.name, "stage name", question.id, location, issue);
      if (stage.skillPath.slug !== question.skillPathId) {
        issue("error", "cross-path-stage-reference", `Question "${question.id}" references stage "${stage.stage.id}" from skill path "${stage.skillPath.slug}" instead of "${question.skillPathId}".`, location, stage.location);
      }
    }
  }

  validateLegacyQuestions(legacyQuestions, issue);
  if (legacyQuestions.length) {
    issue("warning", "legacy-question-system", `${legacyQuestions.length} Higher Physics questions use the retained legacy schema and receive compatibility checks only.`, "data/questions.ts");
  }

  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  return { counts, issues, errors, warnings };
}

export function formatValidationReport(report: ContentValidationReport) {
  const lines = [
    "STEM Forge Content Validation",
    "",
    `Subjects: ${report.counts.subjects}`,
    `Courses: ${report.counts.courses}`,
    `Spec areas: ${report.counts.specAreas}`,
    `Specification strands: ${report.counts.specificationStrands}`,
    `Skill paths: ${report.counts.skillPaths}`,
    `Active skill paths: ${report.counts.activeSkillPaths}`,
    `Archived skill paths: ${report.counts.archivedSkillPaths}`,
    `Stages: ${report.counts.stages}`,
    `Active stages: ${report.counts.activeStages}`,
    `Archived stages: ${report.counts.archivedStages}`,
    `Canonical questions: ${report.counts.questions}`,
    `Active canonical questions: ${report.counts.activeQuestions}`,
    `Archived canonical questions: ${report.counts.archivedQuestions}`,
    `Versioned canonical questions: ${report.counts.versionedQuestions}`,
    `Legacy questions: ${report.counts.legacyQuestions}`,
    `Resources: ${report.counts.resources}`,
    `Active resources: ${report.counts.activeResources}`,
    `Archived resources: ${report.counts.archivedResources}`,
    "",
  ];
  for (const item of report.issues) {
    lines.push(`${item.severity.toUpperCase()} [${item.code}]`, item.message, "Found in:", ...item.locations.map((location) => `- ${location}`), "");
  }
  lines.push("Validation Summary", `Errors: ${report.errors.length}`, `Warnings: ${report.warnings.length}`);
  return lines.join("\n");
}

function validateQuestion(question: Question, location: string, issue: IssueWriter) {
  validateRequiredText(question.questionText, "Question text", location, issue);
  validateRequiredText(question.correctAnswer, "Correct answer", location, issue);
  validateRequiredText(question.source, "Source metadata", location, issue);
  validateRequiredText(question.hint, "Hint", location, issue, "warning");
  validateRequiredText(question.workedSolution, "Worked solution", location, issue, "warning");
  validateRequiredText(question.finalAnswer, "Final answer", location, issue, "warning");
  if (!Number.isInteger(question.marks) || question.marks <= 0) issue("error", "invalid-marks", `Question "${question.id}" must have positive whole-number marks.`, location);
  if (!Number.isInteger(question.displayOrder) || question.displayOrder <= 0) issue("error", "invalid-display-order", `Question "${question.id}" must have a positive whole-number displayOrder.`, location);
  if (!Array.isArray(question.acceptedAnswers)) {
    issue("error", "invalid-accepted-answers", `Question "${question.id}" acceptedAnswers must be an array.`, location);
    return;
  }
  if (AUTO_MARKED_TYPES.has(question.answerType) && question.acceptedAnswers.length === 0) {
    issue("error", "empty-accepted-answers", `Auto-marked question "${question.id}" must provide at least one accepted answer.`, location);
  }
  const invalidAnswerIndex = question.acceptedAnswers.findIndex((answer) => typeof answer !== "string" || !answer.trim());
  if (invalidAnswerIndex >= 0) issue("error", "invalid-accepted-answer", `Question "${question.id}" contains an empty or non-string accepted answer at index ${invalidAnswerIndex}.`, location);
  for (const answer of findDuplicates(question.acceptedAnswers.map((value) => (typeof value === "string" ? value.trim().toLowerCase() : String(value))))) {
    issue("warning", "duplicate-accepted-answer", `Question "${question.id}" repeats accepted answer "${answer}".`, location);
  }
  if (question.correctAnswer.trim() && !question.acceptedAnswers.some((answer) => typeof answer === "string" && answer.trim() === question.correctAnswer.trim())) {
    issue("warning", "canonical-answer-not-accepted", `Question "${question.id}" correctAnswer is not present verbatim in acceptedAnswers.`, location);
  }
  if (question.answerType === "multiple_choice") {
    if (!question.options?.length) issue("error", "missing-options", `Multiple-choice question "${question.id}" has no options.`, location);
    else if (!question.options.some((option) => question.acceptedAnswers.includes(option.value))) {
      issue("error", "unanswerable-multiple-choice", `Multiple-choice question "${question.id}" has no option value in acceptedAnswers.`, location);
    }
  }
}

function validateStageShape(
  stage: LearningStage,
  location: string,
  validateId: (id: unknown, kind: string, location: string, uniquenessKey?: string) => void,
  issue: IssueWriter,
  kind: string,
) {
  validateId(stage.id, kind, location, `declared-stage:${stage.id}:v${String(stage.stageVersion)}`);
  validatePositiveInteger(stage.stageVersion, "stageVersion", kind, stage.id, location, issue, "invalid-stage-version");
  validateContentStatus(stage.contentStatus, kind, stage.id, location, issue);
  validateRequiredText(stage.name, `${kind} name`, location, issue);
  if (!Array.isArray(stage.questionIds)) issue("error", "invalid-stage-question-list", `${kind} "${stage.id}" questionIds must be an array.`, location);
  if (stage.questions !== stage.questionIds.length) issue("error", "stage-question-count-mismatch", `${kind} "${stage.id}" declares ${stage.questions} questions but references ${stage.questionIds.length}.`, location);
}

function validateResources(
  skillPath: SkillPath,
  pathLocation: string,
  validateId: (id: unknown, kind: string, location: string, uniquenessKey?: string) => void,
  issue: IssueWriter,
) {
  const resources: Array<{ resource: ContentResource; kind: string }> = [
    ...(skillPath.notes ?? []).map((resource) => ({ resource, kind: "Note" })),
    ...(skillPath.formulaCards ?? []).map((resource) => ({ resource, kind: "Formula card" })),
    ...(skillPath.workedExamples ?? []).map((resource) => ({ resource, kind: "Worked example" })),
    ...(skillPath.flashcards ?? []).map((resource) => ({ resource, kind: "Flashcard" })),
    ...(skillPath.practiceSets ?? []).map((resource) => ({ resource, kind: "Practice set" })),
  ];
  for (const { resource, kind } of resources) {
    const location = `${pathLocation}/resource:${resource.id}`;
    validateId(resource.id, kind, location, `resource:${resource.id}`);
    validatePositiveInteger(resource.contentRevision, "contentRevision", kind, resource.id, location, issue, "invalid-content-revision");
    validateContentStatus(resource.contentStatus, kind, resource.id, location, issue);
    validateRequiredText(resource.title ?? (resource as Flashcard).front, `${kind} title`, location, issue);
    if (kind === "Note") validateRequiredText((resource as NoteBlock).body, "Note body", location, issue, "warning");
    if (kind === "Formula card") validateRequiredText((resource as FormulaCard).formula, "Formula", location, issue, "warning");
    if (kind === "Worked example") validateRequiredText((resource as WorkedExample).finalAnswer, "Worked example final answer", location, issue, "warning");
    if (kind === "Flashcard") validateRequiredText((resource as Flashcard).back, "Flashcard answer", location, issue, "warning");
    if (kind === "Practice set" && (resource as PracticeSet).questionCount <= 0) issue("warning", "empty-practice-set", `Practice set "${resource.id}" has no questions.`, location);
  }
}

function validateLegacyQuestions(questions: StemForgeQuestion[], issue: IssueWriter) {
  const seen = new Map<string, string>();
  for (const question of questions) {
    const location = `data/questions.ts#${question.id}`;
    if (!question.id || !ID_PATTERN.test(question.id) || RESERVED_IDS.has(question.id)) issue("error", "invalid-legacy-question-id", `Legacy question has invalid ID "${question.id}".`, location);
    const existing = seen.get(question.id);
    if (existing) issue("error", "duplicate-legacy-question-id", `Duplicate legacy question ID "${question.id}".`, existing, location);
    else seen.set(question.id, location);
    if (!question.question.trim()) issue("error", "empty-legacy-question", `Legacy question "${question.id}" has empty question text.`, location);
    if (!question.answer.trim()) issue("error", "empty-legacy-answer", `Legacy question "${question.id}" has an empty answer.`, location);
    if (!Number.isInteger(question.marks) || question.marks <= 0) issue("error", "invalid-legacy-marks", `Legacy question "${question.id}" has invalid marks.`, location);
    if (!question.solution.length) issue("warning", "empty-legacy-solution", `Legacy question "${question.id}" has no solution steps.`, location);
  }
}

function validateRequiredText(value: unknown, label: string, location: string, issue: IssueWriter, severity: ContentValidationIssue["severity"] = "error") {
  if (typeof value !== "string" || !value.trim()) issue(severity, `empty-${slugify(label)}`, `${label} must not be empty.`, location);
}

function validateSiblingSlugs(slugs: string[], kind: string, location: string, issue: IssueWriter) {
  for (const slug of findDuplicates(slugs)) issue("error", "duplicate-sibling-slug", `Duplicate ${kind} slug "${slug}" within the same parent.`, location);
}

function compareReference(actual: string, expected: string, field: string, questionId: string, location: string, issue: IssueWriter) {
  if (actual !== expected) issue("error", "hierarchy-mismatch", `Question "${questionId}" ${field} is "${actual}" but its referenced path uses "${expected}".`, location);
}

function countResources(skillPath: SkillPath) {
  return (skillPath.notes?.length ?? 0) + (skillPath.formulaCards?.length ?? 0) + (skillPath.workedExamples?.length ?? 0) + (skillPath.flashcards?.length ?? 0) + (skillPath.practiceSets?.length ?? 0);
}

function countResourceLifecycle(skillPath: SkillPath, counts: ContentValidationCounts) {
  const resources: ContentResource[] = [
    ...(skillPath.notes ?? []),
    ...(skillPath.formulaCards ?? []),
    ...(skillPath.workedExamples ?? []),
    ...(skillPath.flashcards ?? []),
    ...(skillPath.practiceSets ?? []),
  ];
  for (const resource of resources) {
    if (resource.contentStatus === "active") counts.activeResources += 1;
    else if (resource.contentStatus === "archived") counts.archivedResources += 1;
  }
}

function countLifecycle(status: unknown, kind: "path" | "stage", counts: ContentValidationCounts) {
  if (kind === "path") {
    if (status === "active") counts.activeSkillPaths += 1;
    else if (status === "archived") counts.archivedSkillPaths += 1;
  } else {
    if (status === "active") counts.activeStages += 1;
    else if (status === "archived") counts.archivedStages += 1;
  }
}

function validatePositiveInteger(
  value: unknown,
  field: string,
  kind: string,
  id: string,
  location: string,
  issue: IssueWriter,
  code: string,
) {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    issue("error", code, `${kind} "${id}" ${field} must be a positive whole number.`, location);
  }
}

function validateContentStatus(
  value: unknown,
  kind: string,
  id: string,
  location: string,
  issue: IssueWriter,
) {
  if (value !== "active" && value !== "archived") {
    issue("error", "invalid-content-status", `${kind} "${id}" contentStatus must be "active" or "archived".`, location);
  }
}

function validateParentLifecycle(
  parentStatus: unknown,
  childStatus: unknown,
  parentKind: string,
  parentId: string,
  childKind: string,
  childId: string,
  parentLocation: string,
  childLocation: string,
  issue: IssueWriter,
) {
  if (parentStatus === "archived" && childStatus === "active") {
    issue("error", "archived-parent-active-child", `Archived ${parentKind} "${parentId}" contains active ${childKind} "${childId}".`, parentLocation, childLocation);
  }
}

function questionLocation(question: Question) {
  return question.subject === "Higher Maths" ? `content/questions/higher-maths/differentiation.ts#${question.id}` : `content/questions#${question.id}`;
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
