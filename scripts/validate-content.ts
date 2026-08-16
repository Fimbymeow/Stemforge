import { canonicalContent } from "../data/canonical-content";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import { formatValidationReport, validateContent } from "../lib/content-validation";
import { contentResolver } from "../lib/content-resolver";
import { higherMathematicsOfficialSkillMappings } from "../data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { validateCanonicalSkillSpecificationMappings } from "../lib/curriculum/official-skill-mapping";
import { validateSpecificationRegister } from "../lib/curriculum/specification-register";
import { buildHigherMathsProductionTracker, validateHigherMathsProductionTracker } from "../lib/curriculum/higher-maths-production";

const report = validateContent({
  subjects: [...canonicalContent.subjects],
  questions: [...canonicalContent.questions],
  legacyQuestions: legacyPhysicsQuestions,
});

console.log(formatValidationReport(report));
const higherMathsContexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === "higher-maths");
const specificationReport = validateSpecificationRegister(higherMathematicsSpecificationRegister);
const mappingReport = validateCanonicalSkillSpecificationMappings({
  register: higherMathematicsSpecificationRegister,
  mappings: higherMathematicsOfficialSkillMappings,
  pathContexts: higherMathsContexts,
});
console.log(`\nOfficial Higher Mathematics foundation\nSpecification points: ${higherMathematicsSpecificationRegister.points.length}\nMapped canonical skills: ${higherMathematicsOfficialSkillMappings.length}\nMapping errors: ${mappingReport.errors.length}`);
const productionTracker = buildHigherMathsProductionTracker();
const productionIssues = validateHigherMathsProductionTracker(productionTracker);
const productionErrors = productionIssues.filter((issue) => issue.severity === "error");
const productionWarnings = productionIssues.filter((issue) => issue.severity === "warning");
console.log(`\nHigher Mathematics production readiness\nRegistered packages: ${productionTracker.entries.filter((entry) => entry.packagePresent).length}\nLive skills: ${productionTracker.entries.filter((entry) => entry.live).length}\nProduction errors: ${productionErrors.length}\nProduction warnings: ${productionWarnings.length}`);
for (const issue of productionIssues) console.log(`${issue.severity.toUpperCase()} [${issue.code}] ${issue.message}`);
if (report.errors.length > 0 || specificationReport.errors.length > 0 || mappingReport.errors.length > 0 || productionErrors.length > 0) {
  for (const issue of [...specificationReport.errors, ...mappingReport.errors]) console.error(`ERROR [${issue.code}] ${issue.message}`);
  process.exitCode = 1;
}
