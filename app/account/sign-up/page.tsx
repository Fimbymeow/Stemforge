import Link from "next/link";
import { signUp } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result } = await searchParams;
  return (
    <AccountShell title="Create an account" introduction="Create an optional account using only an email address and password." result={result}>
      <form action={signUp} className="mt-6">
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-help" />
        <p id="password-help" className="mt-2 text-sm text-muted">Use at least 8 characters. STEM Forge never receives or stores your password.</p>
        <SubmitButton idle="Create account" pending="Creating account…" />
      </form>
      <p className="mb-0 mt-5 text-sm">Already registered? <Link href="/account/sign-in" className="font-semibold text-forge underline">Sign in</Link>.</p>
    </AccountShell>
  );
}
