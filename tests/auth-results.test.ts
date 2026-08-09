import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_RESULT_MESSAGES, mapOAuthCallbackError, mapProviderError, readAuthResultCode } from "../lib/auth/results";
import { safeAuthRedirect } from "../lib/auth/redirects";

test("auth callback destinations allow only bounded account and learning routes", () => {
  assert.equal(safeAuthRedirect("/account"), "/account");
  assert.equal(safeAuthRedirect("/account/update-password"), "/account/update-password");
  assert.equal(safeAuthRedirect("/dashboard"), "/dashboard");
  assert.equal(safeAuthRedirect("/question/hm-calc-diff-basic-f-001"), "/question/hm-calc-diff-basic-f-001");
  assert.equal(safeAuthRedirect("https://attacker.example"), "/account");
  assert.equal(safeAuthRedirect("//attacker.example"), "/account");
  assert.equal(safeAuthRedirect("/account/sign-in"), "/account");
});

test("OAuth callback errors are bounded and never expose provider details", () => {
  assert.equal(mapOAuthCallbackError("access_denied", "The learner cancelled"), "oauth_cancelled");
  assert.equal(mapOAuthCallbackError("identity_already_exists", "provider details"), "oauth_identity_conflict");
  assert.equal(mapOAuthCallbackError("server_error", "sensitive raw provider error"), "oauth_unavailable");
  assert.equal(AUTH_RESULT_MESSAGES.oauth_unavailable.includes("sensitive"), false);
});

test("provider errors map to restrained learner-safe results", () => {
  assert.equal(mapProviderError("Invalid login credentials"), "invalid_credentials");
  assert.equal(mapProviderError("Email not confirmed"), "unverified_email");
  assert.equal(mapProviderError("Password should be longer"), "password_invalid");
  assert.equal(mapProviderError("database details that must not leak"), "unexpected");
  assert.equal(readAuthResultCode("not-a-code"), null);
  assert.equal(AUTH_RESULT_MESSAGES.invalid_credentials, "Check your email and password, then try again.");
});
