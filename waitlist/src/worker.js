// @ts-check

const MAX_REQUEST_BYTES = 512;
const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

/** @typedef {"joined" | "already_joined" | "invalid_email" | "rate_limited" | "server_error"} WaitlistStatus */
/** @typedef {{ success: boolean, meta?: { changes?: number } }} D1Result */
/** @typedef {{ ok: false, status: number } | { ok: true, email: string }} PayloadResult */
/** @typedef {{ bind: (...values: unknown[]) => D1Statement, run: () => Promise<D1Result> }} D1Statement */
/** @typedef {{ prepare: (query: string) => D1Statement }} WaitlistDatabase */
/** @typedef {{ limit: (options: { key: string }) => Promise<{ success: boolean }> }} WaitlistRateLimiter */
/** @typedef {{ fetch: (request: Request) => Promise<Response> }} AssetBinding */
/** @typedef {{ WAITLIST_DB: WaitlistDatabase, WAITLIST_RATE_LIMITER: WaitlistRateLimiter, ASSETS: AssetBinding }} Env */

/** @param {WaitlistStatus} status @param {number} httpStatus @param {HeadersInit} [extraHeaders] */
function jsonResponse(status, httpStatus, extraHeaders = {}) {
  return new Response(JSON.stringify({ status }), {
    status: httpStatus,
    headers: { ...PRIVATE_HEADERS, ...extraHeaders },
  });
}

/** @param {string} value */
export function normaliseEmail(value) {
  return value.trim().toLowerCase();
}

/** @param {string} value */
export function isValidEmail(value) {
  const email = normaliseEmail(value);
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1) return false;
  const local = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  return local.length <= 64
    && domain.includes(".")
    && !domain.startsWith(".")
    && !domain.endsWith(".")
    && !domain.includes("..");
}

/** @param {string} value */
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** @param {Request} request @returns {Promise<PayloadResult>} */
async function readPayload(request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return { ok: false, status: 415 };
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const bytes = Number(declaredLength);
    if (!Number.isInteger(bytes) || bytes < 0) return { ok: false, status: 400 };
    if (bytes > MAX_REQUEST_BYTES) return { ok: false, status: 413 };
  }

  let raw;
  try {
    raw = await request.arrayBuffer();
  } catch {
    return { ok: false, status: 400 };
  }
  if (raw.byteLength > MAX_REQUEST_BYTES) return { ok: false, status: 413 };

  /** @type {unknown} */
  let value;
  try {
    value = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return { ok: false, status: 400 };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, status: 400 };

  const payload = /** @type {Record<string, unknown>} */ (value);
  if (Object.keys(payload).some((key) => key !== "email" && key !== "website")) return { ok: false, status: 400 };
  if (typeof payload.email !== "string" || !isValidEmail(payload.email)) return { ok: false, status: 400 };
  if (payload.website !== undefined && typeof payload.website !== "string") return { ok: false, status: 400 };
  if (payload.website) return { ok: false, status: 400 };

  return { ok: true, email: normaliseEmail(payload.email) };
}

/** @param {Request} request @param {Env} env */
export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/waitlist") {
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ status: "invalid_email" }), {
      status: 405,
      headers: { ...PRIVATE_HEADERS, Allow: "POST" },
    });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return jsonResponse("invalid_email", 403);

  const payload = await readPayload(request);
  if (!payload.ok) return jsonResponse("invalid_email", payload.status);

  try {
    const limit = await env.WAITLIST_RATE_LIMITER.limit({ key: `email:${await sha256(payload.email)}` });
    if (!limit.success) return jsonResponse("rate_limited", 429, { "Retry-After": "60" });

    const result = await env.WAITLIST_DB
      .prepare("INSERT INTO waitlist_subscriptions (email, source) VALUES (?, 'website') ON CONFLICT(email) DO NOTHING")
      .bind(payload.email)
      .run();
    if (!result.success) return jsonResponse("server_error", 503);
    return jsonResponse(result.meta?.changes === 0 ? "already_joined" : "joined", 200);
  } catch {
    return jsonResponse("server_error", 503);
  }
}

const worker = {
  /** @param {Request} request @param {Env} env */
  fetch(request, env) {
    return handleRequest(request, env);
  },
};

export default worker;
