import { canonicalContent } from "../data/canonical-content";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import { formatValidationReport, validateContent } from "../lib/content-validation";

const report = validateContent({
  subjects: [...canonicalContent.subjects],
  questions: [...canonicalContent.questions],
  legacyQuestions: legacyPhysicsQuestions,
});

console.log(formatValidationReport(report));
if (report.errors.length > 0) process.exitCode = 1;
