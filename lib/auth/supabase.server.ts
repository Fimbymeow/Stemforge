import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";

export async function createSupabaseServerClient() {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") throw new Error("Authentication is not available.");
  const cookieStore = await cookies();

  return createServerClient(config.supabaseUrl, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware refreshes them.
        }
      },
    },
  });
}
