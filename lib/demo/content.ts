import { contentResolver } from "@/lib/content-resolver";

export function getDemoSkill() {
  const context = contentResolver.getPathContext("chain-rule");
  return context?.subject.subjectSlug === "higher-maths" && context.skillPath.slug === "chain-rule" ? context : undefined;
}

export function getDemoQuestion(id: string) {
  const context = contentResolver.getQuestionContext(id);
  return context?.subject.subjectSlug === "higher-maths"
    && context.skillPath.slug === "chain-rule"
    && context.question.skillPathId === "chain-rule"
    && context.stage.questionIds.includes(id) ? context : undefined;
}

export function getDemoQuestions() {
  const skill = getDemoSkill();
  return skill ? contentResolver.getPathQuestions(skill.skillPath).filter((question) => Boolean(getDemoQuestion(question.id))) : [];
}

export function isDemoRoute(pathname: string) {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

/** Curriculum structure only; counts never represent learner completion. */
export function getDemoPathway() {
  const stages = getDemoSkill()?.skillPath.learningStages ?? [];
  return [
    { id: "notes", label: "Notes", description: "Theory, definitions and worked examples.", count: null, href: demoNavigation.notes },
    ...stages.map((stage) => ({ id: stage.id, label: stage.name === "Past Paper-style Questions" ? "Exam practice" : stage.name,
      description: stage.description, count: stage.questionIds.filter((id) => Boolean(getDemoQuestion(id))).length,
      href: stage.questionIds.map((id) => demoNavigation.question(id)).find((href) => href !== null) ?? demoNavigation.skill })),
  ];
}

export const demoNavigation = {
  home: "/demo",
  skill: "/demo/chain-rule",
  notes: "/demo/chain-rule/notes",
  question(id: string) { return getDemoQuestion(id) ? `/demo/question/${encodeURIComponent(id)}` : null; },
};
