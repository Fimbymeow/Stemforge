"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ConfidenceDisagreementDialog } from "@/components/confidence/confidence-disagreement-dialog";
import type { UseLearnerConfidenceResult } from "@/components/confidence/use-learner-confidence";
import { shouldPromptConfidenceDisagreement } from "@/lib/confidence/disagreement";
import { CONFIDENCE_LEVELS, CONFIDENCE_LEVEL_RANK } from "@/lib/confidence/types";
import type { ConfidenceLevel, ConfidenceSuggestion } from "@/lib/confidence/types";
import { CONFIDENCE_LABEL, CONFIDENCE_SELECTED } from "@/components/confidence/confidence-presentation";

export { CONFIDENCE_LABEL } from "@/components/confidence/confidence-presentation";

/** success/warning/danger — the same semantic tokens Review and stage-completion status already use for general state, not only answer-grading. */
const CONFIDENCE_TONE = CONFIDENCE_SELECTED;

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
    const saved = confidence.setRating(skillPathId, pendingLevel, suggestion && evidenceFingerprint ? {
        skillPathId,
        learnerLevel: pendingLevel,
        suggestedLevel: suggestion.level,
        evidenceFingerprint,
        decidedAt: new Date().toISOString(),
      } : undefined);
    if (saved) setPendingLevel(null);
  }

  const showSuggestionHint = suggestion !== null && level !== null && CONFIDENCE_LEVEL_RANK[level] > CONFIDENCE_LEVEL_RANK[suggestion.level];
  const summaryLabel = level ? CONFIDENCE_LABEL[level] : variant === "detailed" ? "Not rated" : "Set confidence";
  const summaryTone = level ? CONFIDENCE_TONE[level] : "border-transparent bg-transparent text-muted";

  return (
    <div className={className}>
      {variant === "detailed" ? <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-secondary">Your confidence</legend>
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-sm border border-rule">
          {CONFIDENCE_LEVELS.map((option) => <button key={option} type="button" aria-pressed={option === level} onClick={() => choose(option)} className={`orthic-stage min-h-14 min-w-0 border-r border-rule px-1 py-2 text-[11px] font-medium last:border-r-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy sm:px-2 sm:text-xs ${option === level ? CONFIDENCE_SELECTED[option] : "bg-white text-secondary"}`}>{CONFIDENCE_LABEL[option]}</button>)}
        </div>
        <div className="mt-2 flex min-h-11 flex-wrap items-center justify-between gap-2 text-xs text-secondary"><span>{level ? `Your rating: ${CONFIDENCE_LABEL[level]}` : "Not rated"}</span>{level ? <button type="button" onClick={() => confidence.clearRating(skillPathId)} className="orthic-secondary-link min-h-11 px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">Clear rating</button> : null}</div>
      </fieldset> : <details className="group/confidence relative">
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
      </details>}
      {showSuggestionHint ? (
        <p className="mt-1 text-xs text-muted">Orthic suggests {CONFIDENCE_LABEL[suggestion.level].toLowerCase()}.</p>
      ) : null}
      <ConfidenceDisagreementDialog
        open={pendingLevel !== null}
        skillName={skillName}
        chosenLevel={pendingLevel ?? "confident"}
        suggestionReason={suggestion?.reason ?? null}
        onKeepOwn={keepOwn}
        onClose={() => setPendingLevel(null)}
      />
    </div>
  );
}
