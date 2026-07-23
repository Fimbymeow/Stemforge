const ACCOUNT_DESTINATIONS = new Set(["/account", "/account/update-password"]);
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function safeAuthRedirect(value: unknown, fallback = "/account") {
  if (typeof value === "string" && ACCOUNT_DESTINATIONS.has(value)) return value;
  return safeLearningReturnDestination(value) ?? fallback;
}

export function safeLearningReturnDestination(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 1 || value.length > 600) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, "https://stemforge.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://stemforge.invalid" || !isLearningPath(url.pathname)) return null;
  if (url.hash && !/^#[A-Za-z0-9._:-]{1,200}$/.test(url.hash)) return null;
  for (const [key, nested] of url.searchParams) {
    if (key !== "returnTo" || safeLearningReturnDestinationWithoutQuery(nested) === null) return null;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function accountHrefFor(destination: unknown) {
  const safe = safeLearningReturnDestination(destination);
  return safe ? `/account?next=${encodeURIComponent(safe)}` : "/account";
}

function safeLearningReturnDestinationWithoutQuery(value: string) {
  const safe = safeLearningReturnDestination(value);
  return safe && !safe.includes("?") && !safe.includes("#") ? safe : null;
}

function isLearningPath(pathname: string) {
  if (["/dashboard", "/subjects", "/practice", "/question", "/resources"].includes(pathname)) return true;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((segment) => !SAFE_SEGMENT.test(segment))) return false;
  if (segments[0] === "subjects") return segments.length >= 2 && segments.length <= 6;
  if (segments[0] === "question") return segments.length === 2;
  if (segments[0] === "practice" && segments[1] === "session") return segments.length === 3;
  return false;
}
