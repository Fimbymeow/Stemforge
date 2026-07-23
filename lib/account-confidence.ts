export type ImportPresentationInput = {
  phase: "checking" | "ready" | "confirming" | "importing" | "success" | "partial" | "failure" | "session_expired";
  localStatus: "empty" | "importable" | "invalid" | "unsupported" | null;
  localMessage?: string | null;
  pendingCount: number;
  differentAccount: boolean;
  differentAccountConfirmed: boolean;
};

export type ImportPresentation =
  | { kind: "checking"; title: string; body: string | null }
  | { kind: "attention" | "empty" | "expired" | "failure" | "partial" | "success" | "complete"; title: string; body: string }
  | { kind: "different_account" | "confirm" | "ready"; title: string; body: string };

export function deriveImportPresentation(input: ImportPresentationInput): ImportPresentation {
  if (input.phase === "checking" || input.localStatus === null) {
    return { kind: "checking", title: "Checking progress on this browser…", body: null };
  }
  if (input.localStatus === "invalid" || input.localStatus === "unsupported") {
    return {
      kind: "attention",
      title: "Progress on this browser needs attention",
      body: input.localMessage ?? "Your saved progress could not be read safely. It has not been changed or uploaded.",
    };
  }
  if (input.localStatus === "empty") {
    return { kind: "empty", title: "No progress to add", body: "There is no learning progress saved on this browser yet." };
  }
  if (input.phase === "session_expired") {
    return {
      kind: "expired",
      title: "Sign in again",
      body: "Your session has expired. Your progress remains safely stored on this browser.",
    };
  }
  if (input.phase === "failure") {
    return {
      kind: "failure",
      title: "Progress was not added",
      body: "Nothing was deleted or replaced. You can try again or continue learning with the progress on this browser.",
    };
  }
  if (input.phase === "partial") {
    return {
      kind: "partial",
      title: "Some progress was added",
      body: "Confirmed items were added safely. Anything not confirmed remains on this browser and can be retried.",
    };
  }
  if (input.phase === "success") {
    return {
      kind: "success",
      title: "Progress added to your account",
      body: "The original progress remains on this browser. Existing account progress was not replaced.",
    };
  }
  if (input.phase === "importing") {
    return {
      kind: "checking",
      title: "Adding progress to your account…",
      body: "Keep this page open. Your local copy remains safely stored on this browser.",
    };
  }
  if (input.pendingCount === 0) {
    return {
      kind: "complete",
      title: "No new progress to add",
      body: "The progress currently saved on this browser has already been confirmed for this account.",
    };
  }
  if (input.differentAccount && !input.differentAccountConfirmed) {
    return {
      kind: "different_account",
      title: "Check which account should receive this progress",
      body: "This browser previously added progress to another account. Continue only if the current account should receive it too.",
    };
  }
  if (input.phase === "confirming") {
    return {
      kind: "confirm",
      title: "Add this browser’s progress?",
      body: "Eligible progress will be added to this account. Existing account progress and the local copy will both be kept, and matching items will not be duplicated.",
    };
  }
  return {
    kind: "ready",
    title: "Progress on this browser is ready to protect",
    body: "Review exactly what will be added before anything is sent to your account.",
  };
}

export function shouldShowGuestProgressProtection(input: {
  accountsAvailable: boolean;
  signedIn: boolean;
  meaningfulEvidenceCount: number;
  dismissedAtEvidenceCount: number | null;
}) {
  if (!input.accountsAvailable || input.signedIn || input.meaningfulEvidenceCount < 1) return false;
  if (input.dismissedAtEvidenceCount === null) return true;
  return input.meaningfulEvidenceCount >= input.dismissedAtEvidenceCount + 4;
}

export function studentProgressSummary(input: { attempts: number; supportEvents: number; achievements: number }) {
  const parts: string[] = [];
  if (input.attempts > 0) parts.push(`${input.attempts} answer${input.attempts === 1 ? "" : "s"}`);
  if (input.supportEvents > 0) parts.push(`${input.supportEvents} help action${input.supportEvents === 1 ? "" : "s"}`);
  if (input.achievements > 0) parts.push(`${input.achievements} milestone${input.achievements === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(", ") : "No learning progress";
}
