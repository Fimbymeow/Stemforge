import Link from "next/link";
import { signIn } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { AccountLearningReturn } from "@/components/account/account-learning-return";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ result?: string; next?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result, next: requestedNext } = await searchParams;
  const next = safeLearningReturnDestination(requestedNext) ?? "/account";
  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AccountShell title="Sign in" introduction="Sign in without changing the progress already stored on this browser." result={result}>
      <form action={signIn} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required aria-describedby={result ? "account-result" : undefined} />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required minLength={8} aria-describedby={result ? "account-result" : undefined} />
        <SubmitButton idle="Sign in" pending="Signing in…" />
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-semibold">
        <Link href="/account/forgot-password" className="text-forge underline">Forgot password?</Link>
        <Link href={`/account/sign-up${nextQuery}`} className="text-forge underline">Create an account</Link>
      </div>
      <AccountLearningReturn requestedDestination={next} />
    </AccountShell>
  );
}
