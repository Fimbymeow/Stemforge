import { redirect } from "next/navigation";
import { updatePassword } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account/sign-in?result=callback_invalid");
  const { result } = await searchParams;
  return (
    <AccountShell title="Choose a new password" introduction="This recovery session is verified. Choose a new password to continue." result={result}>
      <form action={updatePassword} className="mt-6">
        <label className="block font-bold" htmlFor="password">New password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-help" />
        <p id="password-help" className="mt-2 text-sm text-muted">Use at least 8 characters.</p>
        <SubmitButton idle="Update password" pending="Updating…" />
      </form>
    </AccountShell>
  );
}
