import { canonicalContent } from "../data/canonical-content";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import { formatValidationReport, validateContent } from "../lib/content-validation";
import { contentResolver } from "../lib/content-resolver";
import { higherMathematicsOfficialSkillMappings } from "../data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { validateCanonicalSkillSpecificationMappings } from "../lib/curriculum/official-skill-mapping";
import { validateSpecificationRegister } from "../lib/curriculum/specification-register";

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
if (report.errors.length > 0 || specificationReport.errors.length > 0 || mappingReport.errors.length > 0) {
  for (const issue of [...specificationReport.errors, ...mappingReport.errors]) console.error(`ERROR [${issue.code}] ${issue.message}`);
  process.exitCode = 1;
}
