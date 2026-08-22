import { createHash } from "node:crypto";

export function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Hash a repository-owned text source independently of its checkout line endings.
 *
 * Line endings are the only normalization performed: CRLF and lone CR become LF.
 * Whitespace, Unicode, encoding content and final-newline presence remain significant.
 */
export function hashCanonicalTextSource(value: string | Uint8Array) {
  const text = typeof value === "string" ? value : Buffer.from(value).toString("utf8");
  return sha256(text.replace(/\r\n?/g, "\n"));
}

export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(",")}]`;
  if (typeof value !== "object") throw new Error("canonical_serialize_unsupported_value");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalSerialize(record[key])}`).join(",")}}`;
}

export function hashCanonical(value: unknown) {
  return sha256(canonicalSerialize(value));
}
