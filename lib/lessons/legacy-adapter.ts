import type { FormulaCard, NoteBlock, SkillPath, WorkedExample } from "@/data/types";
import { estimateLessonReadingMinutes } from "@/lib/lessons/lesson-document";
import type { CalloutSemantic, LessonBlock, LessonDocument } from "@/lib/lessons/types";
import { LESSON_SCHEMA_VERSION } from "@/lib/lessons/types";

/**
 * Compatibility only: legacy arrays do not encode one cross-resource teaching order.
 * The adapter therefore uses the fixed fallback groups Notes -> Formula cards -> Worked
 * examples, then displayOrder and stable ID inside each group. This order must not be
 * mistaken for an authored pedagogical sequence.
 */
export function adaptLegacyResourcesToLessonDocument(skillPath: SkillPath): LessonDocument | null {
  const notes = stableLegacyOrder(skillPath.notes ?? []);
  const formulaCards = stableLegacyOrder(skillPath.formulaCards ?? []);
  const workedExamples = stableLegacyOrder(skillPath.workedExamples ?? []);
  if (!notes.length && !formulaCards.length && !workedExamples.length) return null;

  const blocks: LessonBlock[] = [
    ...notes.map(adaptNote),
    ...formulaCards.map(adaptFormula),
    ...workedExamples.map(adaptWorkedExample),
  ];
  const firstStageHref = skillPath.learningStages?.find((stage) => stage.href)?.href ?? skillPath.href;
  const contentRevision = Math.max(1, ...[...notes, ...formulaCards, ...workedExamples].map((resource) => resource.contentRevision));

  return {
    lessonId: `${skillPath.slug}-legacy-lesson`,
    skillPathId: skillPath.slug,
    schemaVersion: LESSON_SCHEMA_VERSION,
    contentRevision,
    contentStatus: skillPath.contentStatus,
    title: skillPath.name,
    objective: skillPath.description,
    qualification: { label: "Course notes" },
    estimatedReadingMinutes: estimateLessonReadingMinutes(blocks),
    blocks,
    closure: {
      recap: "Review the key ideas above, then use the guided questions to put them into practice.",
      foundationsHref: firstStageHref,
    },
  };
}

function stableLegacyOrder<T extends { id: string; displayOrder?: number }>(resources: readonly T[]) {
  return [...resources].sort((left, right) => (left.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.displayOrder ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id));
}

function adaptNote(note: NoteBlock): LessonBlock {
  if (note.variant === "tip" || note.variant === "warning" || note.variant === "exam") {
    const semantic: CalloutSemantic = note.variant === "warning" ? "warning" : note.variant === "exam" ? "exam_tip" : "key_idea";
    return {
      blockId: note.id,
      type: "callout",
      semantic,
      title: note.title,
      content: note.body,
      formula: note.mathContent,
    };
  }
  return { blockId: note.id, type: "prose", content: `## ${note.title}\n\n${note.body}${note.mathContent ? `\n\n${note.mathContent}` : ""}` };
}

function adaptFormula(formula: FormulaCard): LessonBlock {
  return {
    blockId: formula.id,
    type: "callout",
    semantic: "formula",
    title: formula.title,
    content: [formula.description, formula.example].filter(Boolean).join("\n\n"),
    formula: formula.formula,
  };
}

function adaptWorkedExample(example: WorkedExample): LessonBlock {
  return {
    blockId: example.id,
    type: "worked_example",
    title: example.title,
    prompt: example.prompt,
    steps: example.steps.map((body, index) => ({ title: `Step ${index + 1}`, body })),
    finalAnswer: example.finalAnswer,
    explanation: example.explanation,
    commonMistake: example.commonMistake,
  };
}
