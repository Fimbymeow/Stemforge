import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";

const productFiles = [
  "app/layout.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "components/landing/navbar.tsx",
  "components/layout/app-sidebar.tsx",
  "components/layout/focused-product-shell.tsx",
  "components/tuition/tuition-navbar.tsx",
  "components/tuition/tuition-footer.tsx",
] as const;

test("primary product, legal and tuition surfaces use the Orthic brand", () => {
  const combined = productFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.match(combined, /Orthic/);
  assert.doesNotMatch(combined, /STEM Forge|STEMForge|Stemforge/);
  assert.doesNotMatch(combined, /stemforge-logo/);
});

test("Orthic has vector wordmark, standalone mark and application icon assets", () => {
  for (const file of ["public/assets/orthic-wordmark.svg", "public/assets/orthic-mark.svg", "app/icon.svg"]) {
    const asset = readFileSync(file, "utf8");
    assert.match(asset, /<svg/);
    assert.match(asset, /234b6e/);
  }
});

test("the rebrand preserves established learner storage contracts", () => {
  assert.equal(PROGRESS_STORAGE_KEY, "stemforge.localProgress.v1");
  assert.equal(PRACTICE_SESSIONS_STORAGE_KEY, "stemforge.practiceSessions.v1");
});
