import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(projectRoot, "..");

export async function buildSite({ production = false, outputDirectory = resolve(projectRoot, "dist"), privacyEmail = process.env.ORTHIC_PRIVACY_CONTACT_EMAIL } = {}) {
  const origin = "https://orthic.co.uk";
  if (production && (!privacyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privacyEmail))) {
    throw new Error("ORTHIC_PRIVACY_CONTACT_EMAIL must be a monitored address for a production waitlist build.");
  }
  const replacements = {
    "{{YEAR}}": String(new Date().getUTCFullYear()),
    "{{ROBOTS}}": production ? "index, follow" : "noindex, nofollow",
    "{{CANONICAL}}": production ? `<link rel="canonical" href="${origin}/">` : "",
    "{{PRIVACY_CANONICAL}}": production ? `<link rel="canonical" href="${origin}/privacy/">` : "",
    "{{OG_URL}}": production ? `<meta property="og:url" content="${origin}/">` : "",
    "{{PRIVACY_CONTACT}}": production
      ? `<a href="mailto:${privacyEmail}">${privacyEmail}</a>`
      : "the monitored privacy address that will be published before launch",
  };

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(resolve(outputDirectory, "assets"), { recursive: true });
  await mkdir(resolve(outputDirectory, "privacy"), { recursive: true });

  for (const [source, destination] of [
    ["site/index.template.html", "index.html"],
    ["site/privacy.template.html", "privacy/index.html"],
  ]) {
    let contents = await readFile(resolve(projectRoot, source), "utf8");
    for (const [token, value] of Object.entries(replacements)) contents = contents.replaceAll(token, value);
    await writeFile(resolve(outputDirectory, destination), contents, "utf8");
  }

  for (const file of ["styles.css", "waitlist.js", "404.html", "_headers"]) {
    await cp(resolve(projectRoot, "site", file), resolve(outputDirectory, file));
  }
  for (const file of ["orthic-mark.svg", "orthic-wordmark.svg"]) {
    await cp(resolve(repositoryRoot, "public", "assets", file), resolve(outputDirectory, "assets", file));
  }
  await writeFile(
    resolve(outputDirectory, "robots.txt"),
    production ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n",
    "utf8",
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const production = process.argv.includes("--production");
  await buildSite({ production });
  console.log(`Built Orthic waitlist (${production ? "production" : "local"}) to waitlist/dist.`);
}
