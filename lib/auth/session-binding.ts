import { createHash } from "node:crypto";

export function sessionBindingFromCookies(values: Array<{ name: string; value: string }>) {
  const canonical = values
    .filter(({ name }) => !name.startsWith("stemforge-erasure-proof-"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, value }) => `${name}\0${value}`)
    .join("\n");
  return createHash("sha256").update(`stemforge-session-binding-v1\0${canonical}`, "utf8").digest("hex");
}
