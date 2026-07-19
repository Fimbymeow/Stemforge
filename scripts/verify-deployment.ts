import { loadEnvConfig } from "@next/env";
import { deploymentIsReady, evaluateDeploymentReadiness } from "@/lib/operations/deployment-readiness";

async function main() {
  loadEnvConfig(process.cwd());
  const production = process.argv.includes("--production");
  const checks = evaluateDeploymentReadiness(process.env, production);
  console.log(`STEM Forge deployment readiness (${production ? "production" : "local dry run"})`);
  for (const check of checks) console.log(`${check.status.toUpperCase()} [${check.code}] ${check.message}`);
  if (!deploymentIsReady(checks)) throw new Error("Deployment readiness failed. No environment values were printed.");
  console.log("Deployment readiness checks passed. No environment values were printed.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Deployment readiness failed.");
  process.exitCode = 1;
});
