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
