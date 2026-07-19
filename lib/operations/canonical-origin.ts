type Environment = Record<string, string | undefined>;

export function parseCanonicalOrigin(value: string | undefined, allowLoopbackHttp = false) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    const loopback = allowLoopbackHttp && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !loopback) return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function canonicalProductionOrigin(environment: Environment) {
  return parseCanonicalOrigin(environment.NEXT_PUBLIC_SITE_URL);
}

export function authOriginMatchesCanonical(environment: Environment) {
  const canonical = canonicalProductionOrigin(environment);
  const auth = parseCanonicalOrigin(environment.STEMFORGE_AUTH_SITE_URL);
  return canonical !== null && auth === canonical;
}
