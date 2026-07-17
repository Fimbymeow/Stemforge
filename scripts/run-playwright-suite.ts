import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import EmbeddedPostgres from "embedded-postgres";
import { runRemoteEvidenceMigrations } from "@/scripts/database/migration-runner";
import { assertSafeTestDatabaseUrl } from "@/scripts/database/safety";

const root = process.cwd();
const enabledMode = process.argv.includes("--auth-enabled");
const realImportMode = process.argv.includes("--real-import");
const realSyncMode = process.argv.includes("--real-sync");
const realAccountSafetyMode = process.argv.includes("--real-account-safety");
const realAuthMode = realImportMode || realSyncMode || realAccountSafetyMode;
const separatorIndex = process.argv.indexOf("--");
const forwardedArgs = separatorIndex >= 0 ? process.argv.slice(separatorIndex + 1) : [];
if (realAuthMode) loadEnvConfig(root);
const port = realAccountSafetyMode ? 3083 : realSyncMode ? 3082 : realImportMode ? 3081 : enabledMode ? 3079 : 3070;
const baseURL = `http://127.0.0.1:${port}`;
const configFile = realAccountSafetyMode ? "playwright.account-safety.config.ts" : realSyncMode ? "playwright.sync.config.ts" : realImportMode ? "playwright.import.config.ts" : enabledMode ? "playwright.auth-enabled.config.ts" : "playwright.config.ts";
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");

let isolatedEnvironment: NodeJS.ProcessEnv = {
  ...process.env,
  STEMFORGE_AUTH_ENABLED: enabledMode ? "true" : "false",
  NEXT_PUBLIC_SUPABASE_URL: enabledMode ? "https://test-project.supabase.co" : "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: enabledMode ? "test-publishable-key" : "",
  STEMFORGE_AUTH_SITE_URL: enabledMode ? baseURL : "",
  STEMFORGE_DATABASE_URL: "",
  STEMFORGE_DATABASE_MIGRATION_URL: "",
  STEMFORGE_AUTH_TEST_EMAIL: "",
  STEMFORGE_AUTH_TEST_PASSWORD: "",
};

if (realAuthMode) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "STEMFORGE_AUTH_TEST_EMAIL", "STEMFORGE_AUTH_TEST_PASSWORD",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) throw new Error(`Real import verification requires: ${missing.join(", ")}. No values were printed.`);
  isolatedEnvironment = {
    ...process.env,
    STEMFORGE_AUTH_ENABLED: "true",
    STEMFORGE_AUTH_SITE_URL: baseURL,
    STEMFORGE_DATABASE_URL: "",
    STEMFORGE_DATABASE_MIGRATION_URL: "",
  };
}

async function run(command: string, args: string[], environment = isolatedEnvironment) {
  const child = spawn(command, args, {
    cwd: root,
    env: environment,
    stdio: "inherit",
    shell: false,
  });
  return waitForExit(child);
}

function waitForExit(child: ChildProcess) {
  return new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

async function waitForServer(server: ChildProcess) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Next server exited before readiness with code ${server.exitCode ?? server.signalCode}.`);
    }
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The server is still starting; retry until the explicit deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Next server did not become ready at ${baseURL} within 30 seconds.`);
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null || server.signalCode !== null || server.pid === undefined) return;
  server.kill();
  if (await exitsWithin(server, 5_000)) return;

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: false,
    });
    if (!(await exitsWithin(killer, 10_000))) killer.kill();
  } else {
    server.kill("SIGKILL");
  }

  if (!(await exitsWithin(server, 10_000))) {
    throw new Error(`Could not stop the Next test server process ${server.pid}.`);
  }
}

async function exitsWithin(child: ChildProcess, milliseconds: number) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise<boolean>((resolve) => {
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      child.off("exit", onExit);
      resolve(false);
    }, milliseconds);
    child.once("exit", onExit);
  });
}

async function main() {
  const realDatabase = realAuthMode ? await startDisposableEvidenceDatabase() : null;
  try {
    if (realDatabase) {
      isolatedEnvironment = { ...isolatedEnvironment, STEMFORGE_DATABASE_URL: realDatabase.databaseUrl };
      await runRemoteEvidenceMigrations(realDatabase.databaseUrl);
    }
    const packageManager = process.env.npm_execpath;
    const buildCode = packageManager && !packageManager.toLowerCase().endsWith(".cmd")
      ? await run(process.execPath, [packageManager, "run", "build"])
      : process.platform === "win32"
        ? await run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "pnpm run build"])
        : await run("pnpm", ["run", "build"]);
    if (buildCode !== 0) return buildCode;

    const server = spawn(process.execPath, [nextCli, "start", "--port", String(port)], {
      cwd: root,
      env: isolatedEnvironment,
      stdio: "inherit",
      shell: false,
    });
    try {
      await waitForServer(server);
      return await run(process.execPath, [playwrightCli, "test", `--config=${configFile}`, ...forwardedArgs]);
    } finally {
      await stopServer(server);
    }
  } finally {
    await realDatabase?.cleanup();
  }
}

async function startDisposableEvidenceDatabase() {
  const databaseDir = path.join(os.tmpdir(), `stemforge-evidence-postgres-${randomUUID()}`);
  const database = `stemforge_evidence_test_${randomUUID().replaceAll("-", "")}`;
  const user = "stemforge_evidence_test";
  const password = `test_${randomUUID()}`;
  const databasePort = await availablePort();
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port: databasePort,
    user,
    password,
    persistent: true,
    onLog: () => undefined,
    onError: () => console.error("The disposable PostgreSQL evidence test process reported an error."),
  });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase(database);
  const databaseUrl = assertSafeTestDatabaseUrl(
    `postgresql://${user}:${encodeURIComponent(password)}@127.0.0.1:${databasePort}/${database}`,
    process.env.STEMFORGE_DATABASE_URL,
  );
  return {
    databaseUrl,
    cleanup: async () => {
      await postgres.stop();
      if (databaseDir.startsWith(os.tmpdir())) await rm(databaseDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

async function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not reserve a PostgreSQL evidence-test port."));
      server.close(() => resolve(address.port));
    });
  });
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown browser test runner error.";
    console.error(message);
    process.exit(1);
  });
