import { createHash } from "node:crypto";

export function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
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
