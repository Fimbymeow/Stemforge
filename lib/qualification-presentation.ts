export type QualificationLevel = "National 5" | "Higher" | "Advanced Higher";

const qualificationPresentation = {
  "National 5": {
    label: "National 5",
    className: "border-emerald-700/25 bg-emerald-50 text-emerald-800",
  },
  Higher: {
    label: "Higher",
    className: "border-blue-700/25 bg-blue-50 text-blue-800",
  },
  "Advanced Higher": {
    label: "Advanced Higher",
    className: "border-violet-700/25 bg-violet-50 text-violet-800",
  },
} as const;

export function getQualificationPresentation(level: string) {
  return qualificationPresentation[level as QualificationLevel] ?? {
    label: level,
    className: "border-line bg-paper text-muted",
  };
}
