import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { mapOAuthCallbackError } from "@/lib/auth/results";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

export async function GET(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return NextResponse.redirect(new URL("/account", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const failure = new URL("/account/sign-in", config.siteUrl);
  failure.searchParams.set("result", "callback_invalid");
  if (destination !== "/account") failure.searchParams.set("next", destination);
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    failure.searchParams.set("result", mapOAuthCallbackError(providerError, request.nextUrl.searchParams.get("error_description")));
    return NextResponse.redirect(failure);
  }
  if (!code) return NextResponse.redirect(failure);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(error ? failure : new URL(destination, config.siteUrl));
}
