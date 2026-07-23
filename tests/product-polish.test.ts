import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountActionFiles = [
  "app/account/page.tsx",
  "components/account/account-shell.tsx",
  "components/account/account-learning-data.tsx",
  "components/account/account-data-controls.tsx",
  "components/account/account-learning-return.tsx",
  "components/account/guest-progress-import.tsx",
  "components/account/guest-progress-protection.tsx",
  "components/account/progress-sync-panel.tsx",
  "components/account/safe-sign-out.tsx",
];

test("account product-register controls use sentence case and the established rounded treatment", () => {
  for (const file of accountActionFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\buppercase\b/, `${file} must not force account actions to uppercase`);
    assert.doesNotMatch(source, /\brounded-md\b/, `${file} must use the established rounded-lg account action treatment`);
  }
});

test("product mockups no longer contain the obsolete orange brand accent", () => {
  for (const file of [
    "public/assets/mockup-dashboard.svg",
    "public/assets/mockup-learning-paths.svg",
    "public/assets/mockup-worked-solutions.svg",
    "public/assets/mockup-progress.svg",
  ]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /#FF7514/i, `${file} contains the obsolete brand accent`);
  }
});
