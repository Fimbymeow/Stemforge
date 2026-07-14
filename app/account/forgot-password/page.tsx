import Link from "next/link";
import { requestPasswordRecovery } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result } = await searchParams;
  return (
    <AccountShell title="Recover access" introduction="Request a secure link to choose a new password." result={result}>
      <form action={requestPasswordRecovery} className="mt-6">
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
        <SubmitButton idle="Send recovery link" pending="Requesting…" />
      </form>
      <p className="mb-0 mt-5 text-sm"><Link href="/account/sign-in" className="font-semibold text-forge underline">Return to sign in</Link></p>
    </AccountShell>
  );
}
