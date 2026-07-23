import Link from "next/link";
import { AccountShell, AccountUnavailable } from "@/components/account/account-shell";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { signOut } from "@/app/account/actions";
import { GuestProgressImport } from "@/components/account/guest-progress-import";
import { createAccountFingerprint } from "@/lib/remote-evidence/authenticated-import.server";
import { ProgressSyncPanel } from "@/components/account/progress-sync-panel";
import { SafeSignOut } from "@/components/account/safe-sign-out";
import { AccountDataControls } from "@/components/account/account-data-controls";
import { AccountLearningData, CurrentBrowserExportButton } from "@/components/account/account-learning-data";
import { BetaReportReceipts } from "@/components/beta-reports/report-receipts";
import { AuthenticatedBetaReportStatus } from "@/components/beta-reports/authenticated-report-status";
import { AccountLearningReturn } from "@/components/account/account-learning-return";
import { createSupabaseServerClient } from "@/lib/auth/supabase.server";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ result?: string; next?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result, next: requestedNext } = await searchParams;
  const next = safeLearningReturnDestination(requestedNext);
  let ownerState: "authenticated" | "unauthenticated" | "owner-unavailable" = "unauthenticated";
  let accountFingerprint: string | null = null;
  let applicationOwnerId: string | null = null;
  let accountEmail: string | null = null;
  try {
    const context = await resolveCurrentAuthenticatedOwner();
    ownerState = context.authenticated ? "authenticated" : "unauthenticated";
    accountFingerprint = context.authenticated ? createAccountFingerprint(context.ownerId) : null;
    applicationOwnerId = context.authenticated ? context.ownerId : null;
    if (context.authenticated) {
      try {
        const supabase = await createSupabaseServerClient();
        accountEmail = (await supabase.auth.getUser()).data.user?.email ?? null;
      } catch {
        accountEmail = null;
      }
    }
  } catch {
    ownerState = "owner-unavailable";
  }

  if (ownerState === "unauthenticated") {
    return (
      <AccountShell title="Your account" introduction="Sign in to manage your optional STEM Forge account." result={result}>
        <div className="mt-5 rounded-xl border border-line bg-paper p-4">
          <h2 className="m-0 text-lg font-extrabold">Protect progress when you choose</h2>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
            Guest progress stays on this browser. An account lets you explicitly add it for safekeeping and, as a separate choice, keep supported progress updated across your devices.
          </p>
          <p className="mb-0 mt-2 text-sm font-semibold">You can keep learning without an account.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={authHref("/account/sign-in", next)} className="inline-flex min-h-12 items-center justify-center rounded-md bg-forge px-5 text-sm font-extrabold uppercase text-white">Sign in</Link>
          <Link href={authHref("/account/sign-up", next)} className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink px-5 text-sm font-extrabold uppercase">Create account</Link>
        </div>
        <AccountLearningReturn requestedDestination={next} />
        <CurrentBrowserExportButton />
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Your account"
      introduction={ownerState === "authenticated"
        ? `Signed in${accountEmail ? ` as ${accountEmail}` : ""}.`
        : "You're signed in, but we can't load your account details right now."}
      result={result}
    >
      {accountFingerprint ? <GuestProgressImport accountFingerprint={accountFingerprint} returnDestination={next} /> : null}
      <AccountLearningReturn requestedDestination={next} />
      {accountFingerprint ? <ProgressSyncPanel accountFingerprint={accountFingerprint} /> : null}
      {accountFingerprint ? (
        <details className="mt-5 rounded-xl border border-line bg-white p-4">
          <summary className="min-h-11 cursor-pointer content-center font-extrabold">More account and data controls</summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">Export, shared-browser, feedback-history, and deletion controls are available here when you need them.</p>
          <AccountDataControls />
          <AccountLearningData />
          <BetaReportReceipts />
          {applicationOwnerId ? <AuthenticatedBetaReportStatus ownerId={applicationOwnerId} /> : null}
        </details>
      ) : null}
      <SafeSignOut action={signOut} />
    </AccountShell>
  );
}

function authHref(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
