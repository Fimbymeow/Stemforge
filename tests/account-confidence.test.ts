import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveImportPresentation,
  shouldShowGuestProgressProtection,
  studentProgressSummary,
} from "../lib/account-confidence";
import {
  accountHrefFor,
  safeAuthRedirect,
  safeLearningReturnDestination,
} from "../lib/auth/redirects";

test("account import presentation gives one truthful state for each learner boundary", () => {
  assert.equal(deriveImportPresentation({
    phase: "ready", localStatus: "empty", pendingCount: 0, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "empty");
  assert.equal(deriveImportPresentation({
    phase: "ready", localStatus: "importable", pendingCount: 3, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "ready");
  assert.equal(deriveImportPresentation({
    phase: "confirming", localStatus: "importable", pendingCount: 3, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "confirm");
  assert.equal(deriveImportPresentation({
    phase: "ready", localStatus: "importable", pendingCount: 0, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "complete");
  assert.equal(deriveImportPresentation({
    phase: "failure", localStatus: "importable", pendingCount: 2, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "failure");
  assert.equal(deriveImportPresentation({
    phase: "session_expired", localStatus: "importable", pendingCount: 2, differentAccount: false, differentAccountConfirmed: false,
  }).kind, "expired");
});

test("guest protection prompt waits for meaningful work and can reappear after more progress", () => {
  assert.equal(shouldShowGuestProgressProtection({
    accountsAvailable: true, signedIn: false, meaningfulEvidenceCount: 0, dismissedAtEvidenceCount: null,
  }), false);
  assert.equal(shouldShowGuestProgressProtection({
    accountsAvailable: true, signedIn: false, meaningfulEvidenceCount: 1, dismissedAtEvidenceCount: null,
  }), true);
  assert.equal(shouldShowGuestProgressProtection({
    accountsAvailable: true, signedIn: false, meaningfulEvidenceCount: 3, dismissedAtEvidenceCount: 1,
  }), false);
  assert.equal(shouldShowGuestProgressProtection({
    accountsAvailable: true, signedIn: false, meaningfulEvidenceCount: 5, dismissedAtEvidenceCount: 1,
  }), true);
  assert.equal(shouldShowGuestProgressProtection({
    accountsAvailable: true, signedIn: true, meaningfulEvidenceCount: 20, dismissedAtEvidenceCount: null,
  }), false);
});

test("student progress summary avoids internal evidence terminology", () => {
  assert.equal(studentProgressSummary({ attempts: 2, supportEvents: 1, achievements: 1 }), "2 answers, 1 help action, 1 milestone");
});

test("safe learning returns accept supported internal destinations and preserve bounded context", () => {
  const resource = "/subjects/higher-maths/formula-cards?returnTo=%2Fpractice%2Fsession%2Fpractice_1#power-rule";
  for (const destination of [
    "/dashboard",
    "/subjects/higher-maths",
    "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    "/question/hm-calc-diff-basic-f-001",
    "/practice",
    "/practice/session/practice_1",
    resource,
  ]) {
    assert.equal(safeLearningReturnDestination(destination), destination);
    assert.equal(safeAuthRedirect(destination), destination);
  }
  assert.equal(accountHrefFor("/question/example"), "/account?next=%2Fquestion%2Fexample");
});

test("unsafe, account-loop, malformed and hidden destinations fail closed", () => {
  for (const destination of [
    "https://attacker.example",
    "//attacker.example/path",
    "/account/sign-in",
    "/api/progress/import",
    "/internal/beta-reports",
    "/subjects/../account",
    "/question/example?token=secret",
    "/practice/session/example?returnTo=https%3A%2F%2Fattacker.example",
    "/question/%2F%2Fevil.example",
  ]) {
    assert.equal(safeLearningReturnDestination(destination), null);
    assert.equal(safeAuthRedirect(destination), "/account");
  }
});
