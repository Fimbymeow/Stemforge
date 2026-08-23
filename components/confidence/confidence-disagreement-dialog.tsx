"use client";

import { useId, useRef } from "react";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { CONFIDENCE_LABEL } from "@/components/confidence/confidence-control";
import { DialogCloseButton, DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui";
import type { ConfidenceLevel, ConfidenceSuggestionReason } from "@/lib/confidence/types";

/**
 * Only shown when a learner actively rates a skill higher than Orthic's own suggestion (Part L) —
 * never for the reverse direction, never when there's no suggestion, and never twice for the same
 * disagreement (suppressed via the caller's override-record + evidence-fingerprint check before
 * this is even opened). Reuses the shared modal focus-trap rather than a new dialog system (Part K).
 */
export function ConfidenceDisagreementDialog({ open, skillName, chosenLevel, suggestionReason, onKeepOwn, onUseSuggestion, onClose }: {
  open: boolean;
  skillName: string;
  chosenLevel: ConfidenceLevel;
  suggestionReason: ConfidenceSuggestionReason | null;
  onKeepOwn: () => void;
  onUseSuggestion: () => void;
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
    <DialogShell ref={dialogRef} labelledBy={titleId} describedBy={descriptionId} size="sm">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-extrabold">Keep {skillName} as {chosenLabel.toLowerCase()}?</h2>
          <DialogCloseButton ref={closeRef} onClick={onClose} label="Close" />
        </div>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
          Your recent work {hintPhrase(suggestionReason)}. Orthic isn&apos;t completely certain, so you can keep your own rating.
        </p>
        <div className="mt-5 grid gap-2">
          <Button ref={keepRef} onClick={onKeepOwn}>Keep as {chosenLabel.toLowerCase()}</Button>
          <Button variant="secondary" onClick={onUseSuggestion}>Use Orthic&apos;s suggestion</Button>
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
