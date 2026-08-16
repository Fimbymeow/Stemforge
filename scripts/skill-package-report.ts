import {
  buildHigherMathsProductionTracker,
  formatHigherMathsProductionEntry,
  formatHigherMathsProductionTracker,
} from "@/lib/curriculum/higher-maths-production";

/** Read-only Higher Maths production status for one skill or the complete course. */
function main() {
  const args = process.argv.slice(2).filter((argument) => argument !== "--");
  const json = args.includes("--json");
  const requestedSkillId = args.find((argument) => !argument.startsWith("--") && argument !== "all");
  const tracker = buildHigherMathsProductionTracker();

  if (!requestedSkillId) {
    console.log(json ? JSON.stringify(tracker, null, 2) : formatHigherMathsProductionTracker(tracker));
    return;
  }

  const entry = tracker.entries.find((candidate) => candidate.skillPathId === requestedSkillId);
  if (!entry) throw new Error(`Unknown Higher Maths skill "${requestedSkillId}".`);
  console.log(json ? JSON.stringify(entry, null, 2) : formatHigherMathsProductionEntry(entry));
}

main();
