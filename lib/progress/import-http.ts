import { MAX_PROGRESS_IMPORT_REQUEST_BYTES, parseProgressImportEnvelope } from "@/lib/progress/import-protocol";
import { validateRemoteEvidenceBatch } from "@/lib/remote-evidence/validation";

export function isProgressImportJson(contentType: string | null) {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export function isProgressImportSameOrigin(origin: string | null, _requestOrigin: string, configuredOrigin: string) {
  if (!origin) return false;
  try {
    const normalized = new URL(origin).origin;
    const configured = new URL(configuredOrigin).origin;
    return normalized === configured;
  } catch {
    return false;
  }
}

export function parseProgressImportBody(raw: string) {
  if (new TextEncoder().encode(raw).length > MAX_PROGRESS_IMPORT_REQUEST_BYTES) {
    return { ok: false as const, status: 413 as const, message: "The progress import request is too large." };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false as const, status: 400 as const, message: "The progress import request is not valid JSON." };
  }
  const parsed = parseProgressImportEnvelope(value);
  if (!parsed.ok) return { ok: false as const, status: 400 as const, message: parsed.message };
  const validated = validateRemoteEvidenceBatch(parsed.envelope.evidence);
  if (validated.fatal) {
    return { ok: false as const, status: 400 as const, message: validated.rejected[0]?.reason ?? "The evidence payload is invalid." };
  }
  return { ok: true as const, envelope: parsed.envelope };
}
