import Link from "next/link";
import { signUp } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";
import { GoogleSignInOption } from "@/components/account/google-sign-in-option";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ result?: string; next?: string }> }) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return <AccountUnavailable />;
  const { result, next: requestedNext } = await searchParams;
  const next = safeLearningReturnDestination(requestedNext) ?? "/account";
  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AccountShell variant="auth" title="Create an account" introduction="Protect your progress across devices." result={result}>
      {config.googleEnabled ? <GoogleSignInOption next={next} /> : null}
      <form action={signUp} className={config.googleEnabled ? "mt-0" : "mt-6"}>
        <input type="hidden" name="next" value={next} />
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required aria-describedby={result ? "account-result" : undefined} />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby={`password-help${result ? " account-result" : ""}`} />
        <p id="password-help" className="mt-2 text-sm text-muted">Use at least 8 characters.</p>
        <SubmitButton idle="Create account" pending="Creating account…" />
      </form>
      <p className="mb-0 mt-4 text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to the <Link href="/terms" className="font-semibold text-forge underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-forge underline">Privacy Notice</Link>.
      </p>
      <p className="mb-0 mt-5 text-center text-sm">Already registered? <Link href={`/account/sign-in${nextQuery}`} className="font-semibold text-forge underline">Sign in</Link>.</p>
    </AccountShell>
  );
}
