import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";
import { ORTHIC_ALTITUDE_PATH, ORTHIC_FOOT_PATH, ORTHIC_OUTLINE_PATH } from "../lib/brand/orthic-geometry";

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
    assert.doesNotMatch(asset, /d66a2c|orange/i);
    assert.match(asset, new RegExp(ORTHIC_OUTLINE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(asset, new RegExp(ORTHIC_ALTITUDE_PATH));
    assert.match(asset, new RegExp(ORTHIC_FOOT_PATH));
  }
});

test("homepage metadata and product visual are Orthic-specific and non-fabricated", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const home = readFileSync("app/page.tsx", "utf8");
  const hero = readFileSync("components/landing/hero.tsx", "utf8");
  const visual = readFileSync("components/landing/product-visual.tsx", "utf8");
  assert.match(layout, /summary_large_image/);
  assert.match(home, /alternates: \{ canonical: "\/" \}/);
  assert.doesNotMatch(layout, /alternates: \{ canonical: "\/" \}/);
  assert.doesNotMatch(layout, /stemforge-6an8/);
  assert.match(hero, /ProductVisual/);
  assert.match(visual, /Basic differentiation/);
  assert.match(visual, /Notes/);
  assert.match(visual, /Foundations/);
  assert.match(visual, /Applications/);
  assert.match(visual, /Exam Questions/);
  assert.doesNotMatch(home + hero + visual, /orthic-skill-page|mockup-dashboard|Mechanics|Kinematics|12-day|avatar/i);
});

test("the rebrand preserves established learner storage contracts", () => {
  assert.equal(PROGRESS_STORAGE_KEY, "stemforge.localProgress.v1");
  assert.equal(PRACTICE_SESSIONS_STORAGE_KEY, "stemforge.practiceSessions.v1");
});
