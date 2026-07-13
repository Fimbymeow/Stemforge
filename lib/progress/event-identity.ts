export type EventIdFactory = (kind: "attempt" | "support" | "snapshot") => string;

export const createEventId: EventIdFactory = (kind) => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${kind}_${uuid}`;
  return `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
};

export function createMigrationEventId(
  kind: "attempt" | "support",
  originalIndex: number,
  record: unknown,
) {
  return `migrated_${kind}_${originalIndex}_${hashText(stableStringify(record))}`;
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function hashText(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
