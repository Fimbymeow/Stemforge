export type QualificationLevel = "National 5" | "Higher" | "Advanced Higher";

const qualificationPresentation = {
  "National 5": {
    label: "National 5",
    className: "border-forge/20 bg-forge-soft text-forge",
  },
  Higher: {
    label: "Higher",
    className: "border-forge/20 bg-forge-soft text-forge",
  },
  "Advanced Higher": {
    label: "Advanced Higher",
    className: "border-forge/20 bg-forge-soft text-forge",
  },
} as const;

export function getQualificationPresentation(level: string) {
  return qualificationPresentation[level as QualificationLevel] ?? {
    label: level,
    className: "border-line bg-paper text-muted",
  };
}
