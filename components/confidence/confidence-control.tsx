"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ConfidenceDisagreementDialog } from "@/components/confidence/confidence-disagreement-dialog";
import type { UseLearnerConfidenceResult } from "@/components/confidence/use-learner-confidence";
import { shouldPromptConfidenceDisagreement } from "@/lib/confidence/disagreement";
import { CONFIDENCE_LEVELS } from "@/lib/confidence/types";
import type { ConfidenceLevel, ConfidenceSuggestion } from "@/lib/confidence/types";

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  needs_work: "Needs work",
  developing: "Developing",
  confident: "Confident",
};

/** success/warning/danger — the same semantic tokens Review and stage-completion status already use for general state, not only answer-grading. */
const CONFIDENCE_TONE: Record<ConfidenceLevel, string> = {
  needs_work: "border-danger bg-danger-soft text-danger",
  developing: "border-warning bg-warning-soft text-warning",
  confident: "border-success bg-success-soft text-success",
};

const CONFIDENCE_DOT: Record<ConfidenceLevel, string> = {
  needs_work: "bg-danger",
  developing: "bg-warning",
  confident: "bg-success",
};

type ConfidenceControlProps = {
  skillPathId: string;
  skillName: string;
  confidence: UseLearnerConfidenceResult;
  suggestion: ConfidenceSuggestion;
  evidenceFingerprint: string | null;
  variant?: "compact" | "detailed";
  className?: string;
};

/**
 * Shared learner-confidence control — the same component (same state, same disagreement logic)
 * renders on both Course Tracker rows (`variant="compact"`) and the Skill Page header
 * (`variant="detailed"`), per Part H's "no duplicate logic" instruction.
 *
 * A learner's own rating is always what's displayed (Part I) — Orthic's suggestion never replaces
 * it. It only surfaces to gate a confirmation when the learner picks a level that rates themselves
 * *higher* than Orthic's current suggestion (the one direction the brief's own example covers);
 * rating yourself lower, matching the suggestion, or clearing never interrupts (Part L).
 */
export function ConfidenceControl({ skillPathId, skillName, confidence, suggestion, evidenceFingerprint, variant = "compact", className = "" }: ConfidenceControlProps) {
  const [pendingLevel, setPendingLevel] = useState<ConfidenceLevel | null>(null);
  const level = confidence.getRating(skillPathId)?.level ?? null;
  const override = confidence.getOverride(skillPathId);

  function choose(next: ConfidenceLevel) {
    if (next === level) return;
    if (shouldPromptConfidenceDisagreement({ chosenLevel: next, suggestion, override, evidenceFingerprint })) {
      setPendingLevel(next);
      return;
    }
    confidence.setRating(skillPathId, next);
  }

  function keepOwn() {
    if (!pendingLevel) return;
    confidence.setRating(skillPathId, pendingLevel);
    if (suggestion && evidenceFingerprint) {
      confidence.recordOverride({
        skillPathId,
        learnerLevel: pendingLevel,
        suggestedLevel: suggestion.level,
        evidenceFingerprint,
        decidedAt: new Date().toISOString(),
      });
    }
    setPendingLevel(null);
  }

  function useSuggestion() {
    if (suggestion) confidence.setRating(skillPathId, suggestion.level);
    setPendingLevel(null);
  }

  const showSuggestionHint = suggestion !== null && level !== null && level !== suggestion.level;
  const summaryLabel = level ? CONFIDENCE_LABEL[level] : variant === "detailed" ? "Not rated" : "Set confidence";
  const summaryTone = level ? CONFIDENCE_TONE[level] : "border-transparent bg-transparent text-muted";

  return (
    <div className={className}>
      {variant === "detailed" ? <p className="text-xs font-bold text-muted">Your confidence</p> : null}
      <details className="group/confidence relative">
        <summary
          aria-label={`Your confidence for ${skillName}: ${level ? CONFIDENCE_LABEL[level] : "not rated"}. Click to change.`}
          className={`flex min-h-10 w-fit cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold [&::-webkit-details-marker]:hidden ${summaryTone}`}
        >
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${level ? CONFIDENCE_DOT[level] : "border border-line"}`} />
          {summaryLabel}
        </summary>
        <div className="absolute right-0 z-10 mt-1 grid w-44 gap-1 rounded-lg border border-line bg-white p-2 shadow-card">
          {CONFIDENCE_LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className="flex min-h-10 items-center justify-between gap-2 rounded-md px-2 text-left text-sm font-bold hover:bg-paper"
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2 rounded-full ${CONFIDENCE_DOT[option]}`} />
                {CONFIDENCE_LABEL[option]}
              </span>
              {option === level ? <Check aria-hidden="true" className="size-3.5 text-forge" /> : null}
            </button>
          ))}
          {level ? (
            <button
              type="button"
              onClick={() => confidence.clearRating(skillPathId)}
              className="min-h-10 rounded-md px-2 text-left text-sm font-bold text-muted hover:bg-paper"
            >
              Clear rating
            </button>
          ) : null}
        </div>
      </details>
      {showSuggestionHint ? (
        <p className="mt-1 text-xs text-muted">Orthic suggests {CONFIDENCE_LABEL[suggestion.level].toLowerCase()}.</p>
      ) : null}
      <ConfidenceDisagreementDialog
        open={pendingLevel !== null}
        skillName={skillName}
        chosenLevel={pendingLevel ?? "confident"}
        suggestionReason={suggestion?.reason ?? null}
        onKeepOwn={keepOwn}
        onUseSuggestion={useSuggestion}
        onClose={() => setPendingLevel(null)}
      />
    </div>
  );
}
