import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";

export async function refreshAuthSession(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  let response = NextResponse.next({ request });
  if (config.status !== "enabled") return response;

  const supabase = createServerClient(config.supabaseUrl, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}
