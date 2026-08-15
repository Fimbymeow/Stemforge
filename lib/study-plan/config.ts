export type StudyPlanConfiguration = { enabled: boolean };

export function getStudyPlanConfiguration(
  env: Readonly<Record<string, string | undefined>> = process.env,
): StudyPlanConfiguration {
  return { enabled: env.STEMFORGE_STUDY_PLAN_ENABLED === "true" };
}

