import Link from "next/link";
import { signIn } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result } = await searchParams;
  return (
    <AccountShell title="Sign in" introduction="Use your verified email and password." result={result}>
      <form action={signIn} className="mt-6">
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required aria-describedby={result ? "auth-help" : undefined} />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
        <SubmitButton idle="Sign in" pending="Signing in…" />
      </form>
      <div id="auth-help" className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-semibold">
        <Link href="/account/forgot-password" className="text-forge underline">Forgot password?</Link>
        <Link href="/account/sign-up" className="text-forge underline">Create an account</Link>
      </div>
    </AccountShell>
  );
}
