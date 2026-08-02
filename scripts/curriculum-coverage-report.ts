import { higherMaths } from "@/data/higher-maths";
import { higherMathematicsCalculusCoverageClaims } from "@/data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsCalculusSkillContracts } from "@/data/curriculum/higher-mathematics/calculus-skill-contracts";
import { proposedCalculusSkillPathIds } from "@/data/curriculum/higher-mathematics/calculus-skill-map";
import { higherMathematicsCalculusTeachingSequence } from "@/data/curriculum/higher-mathematics/calculus-teaching-sequence";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import { computeCurriculumCoverageReport, formatCurriculumCoverageReport } from "@/lib/curriculum/coverage";

/**
 * Prints the Higher Mathematics Calculus curriculum coverage report — structured JSON to
 * stderr-safe stdout diagnostics off, human-readable text as the primary output. This is a
 * read-only reporting script: it does not write files, does not import content, and is not
 * the package-level importer described (and explicitly deferred) in the Content Production
 * Engine specification.
 */
function main() {
  const calculus = higherMaths.courseAreas.find((area) => area.slug === "calculus");
  if (!calculus) throw new Error("Higher Maths Calculus course area not found.");
  const liveSkillPaths = calculus.specAreas.flatMap((specArea) => specArea.skillPaths ?? []);

  const report = computeCurriculumCoverageReport({
    register: higherMathematicsSpecificationRegister,
    claims: higherMathematicsCalculusCoverageClaims,
    contracts: higherMathematicsCalculusSkillContracts,
    prerequisiteEdges: higherMathematicsCalculusPrerequisites,
    sequenceEntries: higherMathematicsCalculusTeachingSequence,
    proposedSkillPathIds: proposedCalculusSkillPathIds,
    liveSkillPaths,
  });

  console.log(formatCurriculumCoverageReport(report));
  console.log("");
  console.log("--- structured report (JSON) ---");
  console.log(JSON.stringify(report, null, 2));
}

main();
