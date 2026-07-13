import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { higherMaths } from "../data/higher-maths";
import { higherPhysics } from "../data/higher-physics";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import { formatValidationReport, validateContent } from "../lib/content-validation";

const report = validateContent({
  subjects: [higherMaths, higherPhysics],
  questions: higherMathsDifferentiationQuestions,
  legacyQuestions: legacyPhysicsQuestions,
});

console.log(formatValidationReport(report));
if (report.errors.length > 0) process.exitCode = 1;
