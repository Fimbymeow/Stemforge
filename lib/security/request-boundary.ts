export const MAX_ACCOUNT_DATA_REQUEST_BYTES = 4096;

export async function parseBoundedJsonRequest(request: Pick<Request, "headers" | "text">, maxBytes: number) {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const bytes = Number(declared);
    if (!Number.isInteger(bytes) || bytes < 0) return { ok: false as const, status: 400 as const, reason: "invalid_length" as const };
    if (bytes > maxBytes) return { ok: false as const, status: 413 as const, reason: "too_large" as const };
  }
  let raw: string;
  try { raw = await request.text(); } catch { return { ok: false as const, status: 400 as const, reason: "unreadable" as const }; }
  if (new TextEncoder().encode(raw).length > maxBytes) return { ok: false as const, status: 413 as const, reason: "too_large" as const };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false as const, status: 400 as const, reason: "invalid_json" as const };
    return { ok: true as const, value: value as Record<string, unknown> };
  } catch { return { ok: false as const, status: 400 as const, reason: "invalid_json" as const }; }
}
