import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest, isValidEmail, normaliseEmail } from "../src/worker.js";

function createEnvironment({ rateLimited = false, databaseFailure = false } = {}) {
  const emails = new Set();
  const environment = {
    WAITLIST_RATE_LIMITER: {
      async limit({ key }) {
        assert.match(key, /^email:[a-f0-9]{64}$/);
        return { success: !rateLimited };
      },
    },
    WAITLIST_DB: {
      prepare(query) {
        assert.match(query, /INSERT INTO waitlist_subscriptions/);
        return {
          bind(email) {
            return {
              bind() { return this; },
              async run() {
                if (databaseFailure) throw new Error("simulated database failure");
                const duplicate = emails.has(email);
                emails.add(email);
                return { success: true, meta: { changes: duplicate ? 0 : 1 } };
              },
            };
          },
          async run() { throw new Error("bind must be called"); },
        };
      },
    },
    ASSETS: { async fetch() { return new Response("asset", { status: 200 }); } },
  };
  return { environment, emails };
}

function request(body, options = {}) {
  return new Request("https://orthic.co.uk/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://orthic.co.uk", ...options.headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function status(response) {
  return { httpStatus: response.status, body: await response.json() };
}

test("email validation trims and normalises case without accepting malformed addresses", () => {
  assert.equal(normaliseEmail("  Learner@Example.COM "), "learner@example.com");
  assert.equal(isValidEmail(" learner@school.scot "), true);
  assert.equal(isValidEmail("learner@example"), false);
  assert.equal(isValidEmail("learner @example.com"), false);
  assert.equal(isValidEmail(`learner@${"a".repeat(250)}.com`), false);
});

test("a valid new email is stored once and duplicate case variants are idempotent", async () => {
  const { environment, emails } = createEnvironment();
  assert.deepEqual(await status(await handleRequest(request({ email: " Learner@Example.COM ", website: "" }), environment)), {
    httpStatus: 200,
    body: { status: "joined" },
  });
  assert.deepEqual([...emails], ["learner@example.com"]);
  assert.deepEqual(await status(await handleRequest(request({ email: "learner@example.com" }), environment)), {
    httpStatus: 200,
    body: { status: "already_joined" },
  });
  assert.equal(emails.size, 1);
});

test("malformed, unexpected, non-JSON, honeypot and oversized payloads are rejected", async () => {
  const { environment } = createEnvironment();
  for (const candidate of [
    request("{"),
    request({ email: "invalid" }),
    request({ email: "learner@example.com", name: "Unexpected" }),
    request({ email: "learner@example.com", website: "bot.example" }),
    request({ email: "learner@example.com" }, { headers: { "content-type": "text/plain" } }),
    request({ email: "learner@example.com" }, { headers: { "content-length": "513" } }),
  ]) {
    const response = await handleRequest(candidate, environment);
    assert.equal(response.ok, false);
    assert.deepEqual(await response.json(), { status: "invalid_email" });
  }
});

test("cross-origin calls and non-POST methods fail closed", async () => {
  const { environment } = createEnvironment();
  const crossOrigin = request({ email: "learner@example.com" }, { headers: { origin: "https://example.com" } });
  assert.equal((await handleRequest(crossOrigin, environment)).status, 403);
  const get = await handleRequest(new Request("https://orthic.co.uk/api/waitlist"), environment);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");
});

test("rate limiting and database failures return deterministic outcomes without false success", async () => {
  const limited = createEnvironment({ rateLimited: true }).environment;
  const limitedResponse = await handleRequest(request({ email: "learner@example.com" }), limited);
  assert.deepEqual(await status(limitedResponse), { httpStatus: 429, body: { status: "rate_limited" } });
  assert.equal(limitedResponse.headers.get("retry-after"), "60");

  const failing = createEnvironment({ databaseFailure: true }).environment;
  assert.deepEqual(await status(await handleRequest(request({ email: "learner@example.com" }), failing)), {
    httpStatus: 503,
    body: { status: "server_error" },
  });
});

test("unknown API routes stay unavailable while static assets use the isolated asset binding", async () => {
  const { environment } = createEnvironment();
  assert.equal((await handleRequest(new Request("https://orthic.co.uk/api/account"), environment)).status, 404);
  assert.equal(await (await handleRequest(new Request("https://orthic.co.uk/"), environment)).text(), "asset");
});

