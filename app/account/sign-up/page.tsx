import Link from "next/link";
import { signUp } from "@/app/account/actions";
import { AccountShell, AccountUnavailable, inputClass } from "@/components/account/account-shell";
import { SubmitButton } from "@/components/account/submit-button";
import { AccountLearningReturn } from "@/components/account/account-learning-return";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ result?: string; next?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result, next: requestedNext } = await searchParams;
  const next = safeLearningReturnDestination(requestedNext) ?? "/account";
  const nextQuery = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AccountShell title="Create an account" introduction="An account is optional. It lets you protect progress after you explicitly choose what to add or sync." result={result}>
      <form action={signUp} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <label className="block font-bold" htmlFor="email">Email address</label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required aria-describedby={result ? "account-result" : undefined} />
        <label className="mt-5 block font-bold" htmlFor="password">Password</label>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby={`password-help${result ? " account-result" : ""}`} />
        <p id="password-help" className="mt-2 text-sm text-muted">Use at least 8 characters. Your password is handled by the secure account provider and is not stored in STEM Forge learning data.</p>
        <SubmitButton idle="Create account" pending="Creating account…" />
      </form>
      <p className="mb-0 mt-4 text-sm leading-relaxed text-muted">If email confirmation is required, we’ll tell you where to continue. Creating an account never imports browser progress automatically.</p>
      <p className="mb-0 mt-5 text-sm">Already registered? <Link href={`/account/sign-in${nextQuery}`} className="font-semibold text-forge underline">Sign in</Link>.</p>
      <AccountLearningReturn requestedDestination={next} />
    </AccountShell>
  );
}
