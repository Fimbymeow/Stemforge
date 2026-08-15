import { writeFile } from "node:fs/promises";
import { formatSimulationReport, simulateStudyPlans } from "@/lib/study-plan/simulation";

void main();

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = simulateStudyPlans(options);
  console.log(formatSimulationReport(report));
  if (options.jsonPath) {
    await writeFile(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`json=${options.jsonPath}`);
  }
}

function parseArguments(args: string[]) {
  const seed = numberArgument(args, "seed", 12345);
  const runs = numberArgument(args, "runs", 10_000);
  const jsonPath = args.find((arg) => arg.startsWith("--json="))?.slice("--json=".length);
  if (!Number.isInteger(seed) || !Number.isInteger(runs) || runs <= 0) throw new Error("Use integer --seed and positive integer --runs values.");
  return { seed, runs, ...(jsonPath ? { jsonPath } : {}) };
}
function numberArgument(args: string[], name: string, fallback: number) {
  const raw = args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  return raw === undefined ? fallback : Number(raw);
}
