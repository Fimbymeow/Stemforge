import { formatP2SimulationReport, runP2Simulation } from "@/lib/study-plan/rebalance-simulation";

const seed = numericArgument("--seed", 24680);
const runs = numericArgument("--runs", 10_000);
console.log(formatP2SimulationReport(runP2Simulation({ seed, runs })));

function numericArgument(name: string, fallback: number) {
  const value = process.argv.find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
