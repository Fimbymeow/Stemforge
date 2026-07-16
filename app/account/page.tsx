import Link from "next/link";
import { AccountShell, AccountUnavailable, buttonClass } from "@/components/account/account-shell";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { signOut } from "@/app/account/actions";
import { GuestProgressImport } from "@/components/account/guest-progress-import";
import { createAccountFingerprint } from "@/lib/remote-evidence/authenticated-import.server";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (getAuthFeatureConfiguration().status !== "enabled") return <AccountUnavailable />;
  const { result } = await searchParams;
  let ownerState: "authenticated" | "unauthenticated" | "owner-unavailable" = "unauthenticated";
  let accountFingerprint: string | null = null;
  try {
    const context = await resolveCurrentAuthenticatedOwner();
    ownerState = context.authenticated ? "authenticated" : "unauthenticated";
    accountFingerprint = context.authenticated ? createAccountFingerprint(context.ownerId) : null;
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
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Your account"
      introduction={ownerState === "authenticated" ? "You are signed in and linked to a stable STEM Forge owner." : "Your provider session is present, but the application owner database is unavailable."}
      result={result}
    >
      <div className="mt-6 rounded-xl border border-line bg-paper p-4">
        <strong>{ownerState === "authenticated" ? "Account ready" : "Owner setup unavailable"}</strong>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Browser progress stays local unless you explicitly choose to add it to this account.</p>
      </div>
      {accountFingerprint ? <GuestProgressImport accountFingerprint={accountFingerprint} /> : null}
      <form action={signOut}><button type="submit" className={buttonClass}>Sign out</button></form>
    </AccountShell>
  );
}
