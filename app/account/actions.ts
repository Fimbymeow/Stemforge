"use server";

import { redirect } from "next/navigation";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { mapProviderError } from "@/lib/auth/results";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function result(path: string, code: string): never {
  redirect(`${path}?result=${encodeURIComponent(code)}`);
}

function enabledConfig() {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") result("/account", "unavailable");
  return config;
}

export async function signUp(formData: FormData) {
  const config = enabledConfig();
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email || password.length < 8) result("/account/sign-up", "password_invalid");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${config.siteUrl}/auth/callback?next=/account` },
  });
  if (error) result("/account/sign-up", mapProviderError(error.message));
  if (data.session) redirect("/account");
  result("/account/sign-in", "signup_check_email");
}

export async function signIn(formData: FormData) {
  enabledConfig();
  const email = field(formData, "email");
  const password = field(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) result("/account/sign-in", mapProviderError(error.message));
  redirect("/account");
}

export async function requestPasswordRecovery(formData: FormData) {
  const config = enabledConfig();
  const email = field(formData, "email");
  if (email) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.siteUrl}/auth/callback?next=/account/update-password`,
    });
  }
  result("/account/forgot-password", "recovery_requested");
}

export async function updatePassword(formData: FormData) {
  enabledConfig();
  const password = field(formData, "password");
  if (password.length < 8) result("/account/update-password", "password_invalid");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) result("/account/update-password", mapProviderError(error.message));
  result("/account", "updated");
}

export async function signOut() {
  enabledConfig();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  result("/account/sign-in", "signed_out");
}
