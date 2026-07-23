export type SubjectFamily = "mathematics" | "science";
export type StudentResourceCapability = "notes" | "flashcards" | "practice";

const capabilitiesByFamily = {
  mathematics: ["notes", "practice"],
  science: ["notes", "flashcards", "practice"],
} as const satisfies Record<SubjectFamily, readonly StudentResourceCapability[]>;

export function getSubjectFamily(subjectName: string): SubjectFamily | null {
  if (["Physics", "Chemistry", "Biology"].includes(subjectName)) return "science";
  if (["Maths", "Mathematics"].includes(subjectName)) return "mathematics";
  return null;
}

export function getStudentResourceCapabilities(family: SubjectFamily) {
  return capabilitiesByFamily[family];
}

export function subjectSupportsResource(
  family: SubjectFamily,
  capability: StudentResourceCapability,
) {
  return (getStudentResourceCapabilities(family) as readonly StudentResourceCapability[]).includes(capability);
}
