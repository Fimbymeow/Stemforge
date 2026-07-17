import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";
import { sessionBindingFromCookies } from "@/lib/auth/session-binding";

export async function reauthenticateCurrentPasswordUser(password: unknown) {
  if (typeof password !== "string" || password.length < 1 || password.length > 1_024) return { ok: false as const, reason: "incorrect_password" as const };
  const supabase = await createSupabaseServerClient();
  const current = await supabase.auth.getUser();
  const user = current.data.user;
  if (current.error || !user?.email || !user.email_confirmed_at) return { ok: false as const, reason: "stale_session" as const };
  const fresh = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (fresh.error || !fresh.data.user) return { ok: false as const, reason: "incorrect_password" as const };
  if (fresh.data.user.id !== user.id) return { ok: false as const, reason: "provider_subject_mismatch" as const };
  return { ok: true as const, providerSubject: user.id };
}

export async function currentSessionBinding() {
  const store = await cookies();
  return sessionBindingFromCookies(store.getAll());
}
