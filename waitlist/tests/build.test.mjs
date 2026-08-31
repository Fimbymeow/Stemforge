import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildSite } from "../scripts/build.mjs";

async function withBuild(options, assertion) {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "orthic-waitlist-"));
  try {
    await buildSite({ ...options, outputDirectory });
    await assertion(outputDirectory);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
}

test("local build is noindex and does not claim the production canonical", async () => {
  await withBuild({ production: false }, async (output) => {
    const html = await readFile(path.join(output, "index.html"), "utf8");
    assert.match(html, /noindex, nofollow/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.doesNotMatch(html, /property="og:url"/);
  });
});

test("production build has orthic.co.uk metadata and a real privacy contact", async () => {
  await withBuild({ production: true, privacyEmail: "privacy@example.com" }, async (output) => {
    const home = await readFile(path.join(output, "index.html"), "utf8");
    const privacy = await readFile(path.join(output, "privacy", "index.html"), "utf8");
    assert.match(home, /<link rel="canonical" href="https:\/\/orthic\.co\.uk\/">/);
    assert.match(home, /<meta property="og:url" content="https:\/\/orthic\.co\.uk\/">/);
    assert.match(home, /content="index, follow"/);
    assert.match(privacy, /href="mailto:privacy@example\.com"/);
    assert.match(privacy, /https:\/\/orthic\.co\.uk\/privacy\//);
  });
});

test("production build refuses to ship without a monitored privacy contact", async () => {
  await assert.rejects(buildSite({ production: true, outputDirectory: path.join(os.tmpdir(), "orthic-invalid-build"), privacyEmail: "" }), /ORTHIC_PRIVACY_CONTACT_EMAIL/);
});

test("isolated source contains no Tuition or learner-product navigation", async () => {
  const html = await readFile(new URL("../site/index.template.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /Tuition/i);
  for (const pathName of ["dashboard", "subjects", "courses", "practice", "review", "activity", "account"]) {
    assert.doesNotMatch(html, new RegExp(`href=["']/${pathName}`, "i"));
  }
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(hrefs.filter((href) => href.startsWith("/")))].sort(), ["/", "/assets/orthic-mark.svg", "/privacy/", "/styles.css"]);
});

test("client assets contain no server binding, database identifier or secret", async () => {
  const files = ["index.template.html", "privacy.template.html", "waitlist.js", "styles.css"];
  const client = (await Promise.all(files.map((file) => readFile(new URL(`../site/${file}`, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(client, /WAITLIST_DB|WAITLIST_RATE_LIMITER|database_id|ORTHIC_PRIVACY_CONTACT_EMAIL|00000000-0000/);
});

