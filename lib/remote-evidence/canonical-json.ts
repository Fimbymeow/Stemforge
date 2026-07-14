import { stableStringify } from "@/lib/progress/event-identity";

export function canonicalJson(value: unknown) {
  return stableStringify(value);
}

export function canonicalJsonEqual(left: unknown, right: unknown) {
  return canonicalJson(left) === canonicalJson(right);
}

export function classifyEvidenceArrival(existing: unknown, incoming: unknown): "duplicate" | "conflict" {
  return canonicalJsonEqual(existing, incoming) ? "duplicate" : "conflict";
}

