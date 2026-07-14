import "server-only";

import type { VerifiedIdentityResolver } from "@/lib/auth/owner-types";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

export class SupabaseVerifiedIdentityResolver implements VerifiedIdentityResolver {
  async resolveVerifiedIdentity() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data.user;
    if (error || !user || !user.email_confirmed_at) return null;
    return { verified: true as const, provider: "supabase", subject: user.id };
  }
}
