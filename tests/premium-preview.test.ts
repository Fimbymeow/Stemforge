import assert from "node:assert/strict";
import test from "node:test";
import {
  PREMIUM_PREVIEW_STORAGE_KEY,
  isPremiumPreviewAvailable,
  premiumAssessmentContext,
  readPremiumPreview,
  writePremiumPreview,
} from "../lib/premium-preview";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("Premium Preview is available only in development or the isolated browser-test environment", () => {
  assert.equal(isPremiumPreviewAvailable({ NODE_ENV: "development" }), true);
  assert.equal(isPremiumPreviewAvailable({ NODE_ENV: "test" }), true);
  assert.equal(isPremiumPreviewAvailable({ NODE_ENV: "production" }), false);
  assert.equal(isPremiumPreviewAvailable({ NODE_ENV: "production", STEMFORGE_E2E_FIXTURES: "true" }), true);
});

test("Premium Preview uses a versioned browser-local preference and fails closed", () => {
  const storage = new MemoryStorage();
  assert.equal(readPremiumPreview(storage), false);
  assert.equal(writePremiumPreview(storage, true), true);
  assert.equal(readPremiumPreview(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(PREMIUM_PREVIEW_STORAGE_KEY)!), { version: 1, enabled: true });
  storage.setItem(PREMIUM_PREVIEW_STORAGE_KEY, "not-json");
  assert.equal(readPremiumPreview(storage), false);
  storage.setItem(PREMIUM_PREVIEW_STORAGE_KEY, JSON.stringify({ version: 2, enabled: true }));
  assert.equal(readPremiumPreview(storage), false);
});

test("free recommendations receive no assessment context while preview preserves it", () => {
  const assessments = [{ id: "class-test" }];
  assert.deepEqual(premiumAssessmentContext(false, assessments), []);
  assert.equal(premiumAssessmentContext(true, assessments), assessments);
});
