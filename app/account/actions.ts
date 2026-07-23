"use server";

import { redirect } from "next/navigation";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";
import { mapProviderError } from "@/lib/auth/results";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function returnDestination(formData: FormData, fallback = "/account") {
  return safeLearningReturnDestination(field(formData, "next")) ?? fallback;
}

function result(path: string, code: string, next?: string): never {
  const params = new URLSearchParams({ result: code });
  if (next) params.set("next", next);
  redirect(`${path}?${params}`);
}

function enabledConfig(next?: string) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") result("/account", "unavailable", next);
  return config;
}

export async function signUp(formData: FormData) {
  const next = returnDestination(formData);
  const config = enabledConfig(next);
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email || password.length < 8) result("/account/sign-up", "password_invalid", next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${config.siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) result("/account/sign-up", mapProviderError(error.message), next);
  if (data.session) redirect(next);
  result("/account/sign-in", "signup_check_email", next);
}

export async function signIn(formData: FormData) {
  const next = returnDestination(formData);
  enabledConfig(next);
  const email = field(formData, "email");
  const password = field(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) result("/account/sign-in", mapProviderError(error.message), next);
  redirect(next);
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

export async function signOut(formData: FormData) {
  const next = returnDestination(formData, "/dashboard");
  enabledConfig(next);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(next);
}
