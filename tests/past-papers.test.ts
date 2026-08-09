import assert from "node:assert/strict";
import test from "node:test";
import { pastPapers } from "../data/past-papers";
import { getPastPapersForSubject } from "../lib/past-papers/catalog";
import type { PastPaperRecord } from "../lib/past-papers/types";
import { validatePastPapers } from "../lib/past-papers/validation";

function cloneRecords(): PastPaperRecord[] {
  return structuredClone(pastPapers) as unknown as PastPaperRecord[];
}

test("the official Higher Maths catalogue is valid, complete and newest-first", () => {
  assert.deepEqual(validatePastPapers(pastPapers), []);
  const records = getPastPapersForSubject("higher-maths");
  assert.equal(records.length, 8);
  assert.deepEqual(records.map((record) => `${record.year}-${record.paperNumber}`), ["2025-1", "2025-2", "2024-1", "2024-2", "2023-1", "2023-2", "2022-1", "2022-2"]);
  assert.equal(new Set(records.map((record) => record.paper.url)).size, 8);
  assert.equal(new Set(records.map((record) => record.markingInstructions.status === "available" ? record.markingInstructions.url : "")).size, 8);
});

test("the catalogue rejects third-party and unrelated official-domain URLs", () => {
  const records = cloneRecords();
  records[0].paper = { status: "available", url: "https://example.com/2025-paper.pdf" };
  records[1].markingInstructions = { status: "available", url: "https://sqa.org.uk/unrelated.pdf" };
  const issues = validatePastPapers(records);
  assert.equal(issues.filter((issue) => issue.code === "invalid-official-past-paper-url").length, 2);
});

test("duplicate paper identities fail validation", () => {
  const records = cloneRecords();
  records.push({ ...records[0], id: "higher-maths-2025-paper-1-copy" });
  assert.ok(validatePastPapers(records).some((issue) => issue.code === "duplicate-past-paper-record"));
});

test("pending resources are honest and never carry guessed URLs", () => {
  const records = cloneRecords();
  records[0].markingInstructions = { status: "pending", note: "Official link has not yet been verified." };
  assert.deepEqual(validatePastPapers(records), []);

  records[0].markingInstructions = { status: "pending", note: "Official link has not yet been verified.", url: "https://sqa.org.uk/guessed.pdf" } as never;
  assert.ok(validatePastPapers(records).some((issue) => issue.code === "unavailable-past-paper-has-url"));
});
