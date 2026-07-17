import assert from "node:assert/strict";
import test from "node:test";
import { sessionBindingFromCookies } from "../lib/auth/session-binding";

test("erasure proof cookies are excluded from stable session binding", () => {
  const before = sessionBindingFromCookies([
    { name: "sb-access-token", value: "session" },
    { name: "sb-refresh-token", value: "refresh" },
  ]);
  const after = sessionBindingFromCookies([
    { name: "stemforge-erasure-proof-00000000-0000-4000-8000-000000000000", value: "proof" },
    { name: "sb-refresh-token", value: "refresh" },
    { name: "sb-access-token", value: "session" },
  ]);
  assert.equal(after, before);
  assert.notEqual(sessionBindingFromCookies([{ name: "sb-access-token", value: "other" }]), before);
});
