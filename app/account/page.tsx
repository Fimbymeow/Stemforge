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

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result } = await searchParams;
  let ownerState: "authenticated" | "unauthenticated" | "owner-unavailable" = "unauthenticated";
  let accountFingerprint: string | null = null;
  let applicationOwnerId: string | null = null;
  try {
    const context = await resolveCurrentAuthenticatedOwner();
    ownerState = context.authenticated ? "authenticated" : "unauthenticated";
    accountFingerprint = context.authenticated ? createAccountFingerprint(context.ownerId) : null;
    applicationOwnerId = context.authenticated ? context.ownerId : null;
  } catch {
    ownerState = "owner-unavailable";
  }

  if (ownerState === "unauthenticated") {
    return (
      <AccountShell title="Your account" introduction="Sign in to manage your optional STEM Forge account." result={result}>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/account/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-md bg-forge px-5 text-sm font-extrabold uppercase text-white">Sign in</Link>
          <Link href="/account/sign-up" className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink px-5 text-sm font-extrabold uppercase">Create account</Link>
        </div>
        <CurrentBrowserExportButton />
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Your account"
      introduction={ownerState === "authenticated" ? "You're signed in to your STEM Forge account." : "You're signed in, but we can't load your account details right now."}
      result={result}
    >
      <div className="mt-6 rounded-xl border border-line bg-paper p-4">
        <strong>{ownerState === "authenticated" ? "Account ready" : "Account setup unavailable"}</strong>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Learning always works without an account. Adding this browser&apos;s progress to your account, and keeping future progress updated automatically, are separate choices you make below.</p>
      </div>
      <AccountLearningReturn />
      {accountFingerprint ? <GuestProgressImport accountFingerprint={accountFingerprint} /> : null}
      {accountFingerprint ? <ProgressSyncPanel accountFingerprint={accountFingerprint} /> : null}
      {accountFingerprint ? <AccountDataControls /> : null}
      {accountFingerprint ? <AccountLearningData /> : null}
      <BetaReportReceipts />
      {applicationOwnerId ? <AuthenticatedBetaReportStatus ownerId={applicationOwnerId} /> : null}
      <SafeSignOut action={signOut} />
    </AccountShell>
  );
}
