import { chainRulePackage } from "@/data/curriculum/higher-mathematics/chain-rule-package";
import { higherMathematicsCalculusCoverageClaims } from "@/data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsCalculusSkillContracts } from "@/data/curriculum/higher-mathematics/calculus-skill-contracts";
import { proposedCalculusSkillPathIds } from "@/data/curriculum/higher-mathematics/calculus-skill-map";
import { resolveSkillPackageEvidence } from "@/lib/curriculum/skill-package-resolver";
import {
  deriveSkillPackageReadiness,
  formatSkillPackageReport,
  validateSkillPackageManifest,
  type SkillPackageKnownReferences,
  type SkillPackageManifest,
} from "@/lib/curriculum/skill-package";

/**
 * Prints the whole-skill package status for one canonical skill — the smallest read-only
 * report that can answer "why is this skill not ready to publish?" It composes Phase 1's
 * curriculum data, the real Content Import parser/classifier, and the pure package-readiness
 * logic in lib/curriculum/skill-package.ts. It performs no writes, no preview/approval/apply,
 * and does not import or publish anything.
 *
 * Usage: pnpm run skill-package-report [-- <skillPathId>]  (defaults to chain-rule, the
 * only manifest currently authored).
 */
const PACKAGES: Record<string, SkillPackageManifest> = {
  "chain-rule": chainRulePackage,
};

function main() {
  const requestedSkillId = process.argv[2] ?? "chain-rule";
  const manifest = PACKAGES[requestedSkillId];
  if (!manifest) {
    throw new Error(`No skill package manifest is authored for "${requestedSkillId}". Available: ${Object.keys(PACKAGES).join(", ")}.`);
  }

  const known: SkillPackageKnownReferences = {
    knownCourseIds: new Set(["higher-maths"]),
    knownSkillIds: new Set(proposedCalculusSkillPathIds),
    knownContractSkillPathIds: new Set(higherMathematicsCalculusSkillContracts.map((contract) => contract.skillPathId)),
    knownCoverageClaimIds: new Set(higherMathematicsCalculusCoverageClaims.map((claim) => claim.claimId)),
    knownHardPrerequisiteEdges: new Set(
      higherMathematicsCalculusPrerequisites
        .filter((edge) => edge.strength === "hard")
        .map((edge) => `${edge.skillPathId}::${edge.requiresSkillPathId}`),
    ),
  };

  const validation = validateSkillPackageManifest(manifest, known);
  const evidence = resolveSkillPackageEvidence(manifest);
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);

  console.log(formatSkillPackageReport({ manifest, validation, readiness, evidence }));

  if (!validation.valid) {
    console.log("\n--- manifest validation errors ---");
    validation.errors.forEach((error) => console.log(`[${error.code}] ${error.message}`));
  }
}

main();
