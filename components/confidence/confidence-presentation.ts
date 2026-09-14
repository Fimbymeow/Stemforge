import type { ConfidenceLevel } from "@/lib/confidence/types";

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  needs_work: "Needs work",
  developing: "Developing",
  confident: "Confident",
};

export const CONFIDENCE_TEXT: Record<ConfidenceLevel, string> = {
  needs_work: "text-danger",
  developing: "text-warning",
  confident: "text-success",
};

export const CONFIDENCE_SELECTED: Record<ConfidenceLevel, string> = {
  needs_work: "border-danger bg-danger-soft text-danger",
  developing: "border-warning bg-warning-soft text-warning",
  confident: "border-success bg-success-soft text-success",
};
