export type PracticeSetupVisibility = {
  showCourseChoice: boolean;
  showPathChoice: boolean;
  showMixedMode: boolean;
};

export function derivePracticeSetupVisibility(courseCount: number, pathCount: number): PracticeSetupVisibility {
  return {
    showCourseChoice: courseCount > 1,
    showPathChoice: pathCount > 1,
    showMixedMode: pathCount > 1,
  };
}

export function deriveVisiblePracticeModes(input: {
  pathCount: number;
  hasNeedsWork: boolean;
  hasRetryIncorrect: boolean;
}): Array<"targeted" | "needs_work" | "retry_incorrect" | "mixed"> {
  return [
    "targeted",
    ...(input.hasNeedsWork ? ["needs_work"] as const : []),
    ...(input.hasRetryIncorrect ? ["retry_incorrect"] as const : []),
    ...(input.pathCount > 1 ? ["mixed"] as const : []),
  ];
}
