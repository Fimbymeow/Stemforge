import assert from "node:assert/strict";
import test from "node:test";
import { mapProviderError, readAuthResultCode } from "../lib/auth/results";
import { safeAuthRedirect } from "../lib/auth/redirects";

test("auth callback destinations use a narrow allowlist", () => {
  assert.equal(safeAuthRedirect("/account"), "/account");
  assert.equal(safeAuthRedirect("/account/update-password"), "/account/update-password");
  assert.equal(safeAuthRedirect("https://attacker.example"), "/account");
  assert.equal(safeAuthRedirect("//attacker.example"), "/account");
  assert.equal(safeAuthRedirect("/dashboard"), "/account");
});

test("provider errors map to restrained learner-safe results", () => {
  assert.equal(mapProviderError("Invalid login credentials"), "invalid_credentials");
  assert.equal(mapProviderError("Email not confirmed"), "unverified_email");
  assert.equal(mapProviderError("Password should be longer"), "password_invalid");
  assert.equal(mapProviderError("database details that must not leak"), "unexpected");
  assert.equal(readAuthResultCode("not-a-code"), null);
});
