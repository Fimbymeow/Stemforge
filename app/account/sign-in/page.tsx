import Link from "next/link";
import { signIn } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";
import { GoogleSignInOption } from "@/components/account/google-sign-in-option";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ result?: string; next?: string }> }) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return <AccountUnavailable />;
  const { result, next: requestedNext } = await searchParams;
  const next = safeLearningReturnDestination(requestedNext) ?? "/account";
  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AccountShell variant="auth" title="Sign in" introduction="Continue with your Orthic account." result={result}>
      {config.googleEnabled ? <GoogleSignInOption next={next} /> : null}
      <form action={signIn} className={config.googleEnabled ? "mt-0" : "mt-6"}>
        <input type="hidden" name="next" value={next} />
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required aria-describedby={result ? "account-result" : undefined} />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required minLength={8} aria-describedby={result ? "account-result" : undefined} />
        <SubmitButton idle="Sign in" pending="Signing in…" />
      </form>
      <div className="mt-5 grid justify-items-center gap-3 text-sm font-semibold">
        <Link href="/account/forgot-password" className="text-forge underline">Forgot password?</Link>
        <p className="m-0 font-normal">New to Orthic? <Link href={`/account/sign-up${nextQuery}`} className="font-semibold text-forge underline">Create an account</Link>.</p>
      </div>
    </AccountShell>
  );
}
