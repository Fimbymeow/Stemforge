export type AuthFeatureConfiguration =
  | { status: "disabled" }
  | { status: "misconfigured"; missing: string[] }
  | { status: "enabled"; supabaseUrl: string; publishableKey: string; siteUrl: string };

type Environment = Record<string, string | undefined>;

export function getAuthFeatureConfiguration(env: Environment = process.env): AuthFeatureConfiguration {
  if (env.STEMFORGE_AUTH_ENABLED !== "true") return { status: "disabled" };

  const required = {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    STEMFORGE_AUTH_SITE_URL: env.STEMFORGE_AUTH_SITE_URL,
  };
  const missing = Object.entries(required).filter(([, value]) => !value?.trim()).map(([name]) => name);
  if (missing.length > 0) return { status: "misconfigured", missing };

  try {
    const siteUrl = new URL(required.STEMFORGE_AUTH_SITE_URL!);
    const supabaseUrl = new URL(required.NEXT_PUBLIC_SUPABASE_URL!);
    if (!/^https?:$/.test(siteUrl.protocol) || !/^https:$/.test(supabaseUrl.protocol)) {
      return { status: "misconfigured", missing: ["valid HTTPS Supabase URL and HTTP(S) site URL"] };
    }
    return {
      status: "enabled",
      supabaseUrl: supabaseUrl.origin,
      publishableKey: required.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      siteUrl: siteUrl.origin,
    };
  } catch {
    return { status: "misconfigured", missing: ["valid authentication URLs"] };
  }
}

export function isAuthFeatureAvailable(env: Environment = process.env) {
  return getAuthFeatureConfiguration(env).status === "enabled";
}
