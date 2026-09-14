"use client";

import { useId, useRef } from "react";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { CONFIDENCE_LABEL } from "@/components/confidence/confidence-presentation";
import { DialogCloseButton, DialogShell } from "@/components/dialog-shell";
import type { ConfidenceLevel, ConfidenceSuggestionReason } from "@/lib/confidence/types";

/**
 * Only shown when a learner actively rates a skill higher than Orthic's own suggestion (Part L) —
 * never for the reverse direction, never when there's no suggestion, and never twice for the same
 * disagreement (suppressed via the caller's override-record + evidence-fingerprint check before
 * this is even opened). Reuses the shared modal focus-trap rather than a new dialog system (Part K).
 */
export function ConfidenceDisagreementDialog({ open, skillName, chosenLevel, suggestionReason, onKeepOwn, onClose }: {
  open: boolean;
  skillName: string;
  chosenLevel: ConfidenceLevel;
  suggestionReason: ConfidenceSuggestionReason | null;
  onKeepOwn: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  useModalFocusTrap({ open, containerRef: dialogRef, initialFocusRef: keepRef, onClose });

  if (!open) return null;

  const chosenLabel = CONFIDENCE_LABEL[chosenLevel];

  return (
    <DialogShell ref={dialogRef} labelledBy={titleId} describedBy={descriptionId} size="sm" className="!rounded-lg !border-rule !bg-paper !text-navy !shadow-sm ![animation-duration:180ms] motion-reduce:![animation:none]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">Save confidence as {chosenLabel}?</h2>
          <DialogCloseButton ref={closeRef} onClick={onClose} label="Cancel confidence change" className="!rounded-sm !border-rule !text-secondary" />
        </div>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
          You&apos;ve rated {skillName} as {chosenLabel}. <span className="text-warning">Orthic&apos;s recent evidence {hintPhrase(suggestionReason)}.</span> You choose the final rating.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="orthic-secondary-link min-h-11 rounded-sm border border-rule px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">Cancel</button>
          <button type="button" ref={keepRef} onClick={onKeepOwn} className="orthic-primary-action min-h-11 rounded-sm bg-navy px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">Save as {chosenLabel}</button>
        </div>
    </DialogShell>
  );
}

function hintPhrase(reason: ConfidenceSuggestionReason | null): string {
  switch (reason) {
    case "open_mistake": return "includes an unresolved mistake";
    case "review_overdue": return "suggests this skill may need more practice";
    case "stalled_with_review_due": return "suggests this skill may need more practice";
    case "completed_no_flags": return "suggests this skill is still developing";
    case "in_progress_no_flags": return "suggests this skill is still developing";
    default: return "suggests this skill may need more practice";
  }
}
