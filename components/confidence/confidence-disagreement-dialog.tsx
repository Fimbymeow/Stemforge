"use client";

import { useId, useRef } from "react";
import { X } from "lucide-react";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { CONFIDENCE_LABEL } from "@/components/confidence/confidence-control";
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4" role="presentation">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-extrabold">Keep {skillName} as {chosenLabel.toLowerCase()}?</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
          Your recent work {hintPhrase(suggestionReason)}. Orthic isn&apos;t completely certain, so you can keep your own rating.
        </p>
        <div className="mt-5 grid gap-2">
          <button ref={keepRef} type="button" onClick={onKeepOwn} className="min-h-11 rounded-lg bg-forge px-4 text-sm font-extrabold text-white">Keep as {chosenLabel.toLowerCase()}</button>
          <button type="button" onClick={onUseSuggestion} className="min-h-11 rounded-lg border border-line px-4 text-sm font-extrabold hover:bg-paper">Use Orthic&apos;s suggestion</button>
        </div>
      </section>
    </div>
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
