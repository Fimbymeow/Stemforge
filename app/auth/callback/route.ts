import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

export async function GET(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return NextResponse.redirect(new URL("/account", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeAuthRedirect(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/account/sign-in?result=callback_invalid", config.siteUrl));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const path = error ? "/account/sign-in?result=callback_invalid" : destination;
  return NextResponse.redirect(new URL(path, config.siteUrl));
}
