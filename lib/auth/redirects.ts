const ALLOWED_AUTH_DESTINATIONS = new Set(["/account", "/account/update-password"]);

export function safeAuthRedirect(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  return ALLOWED_AUTH_DESTINATIONS.has(value) ? value : fallback;
}
