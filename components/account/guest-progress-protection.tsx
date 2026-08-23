"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuthFeatureAvailable } from "@/components/auth-feature-provider";
import { shouldShowGuestProgressProtection } from "@/lib/account-confidence";
import { accountHrefFor } from "@/lib/auth/redirects";

const DISMISSAL_KEY = "stemforge.accountProtectionPrompt.v1";

export function GuestProgressProtection({
  meaningfulEvidenceCount,
  signedIn,
  authStateReady,
}: {
  meaningfulEvidenceCount: number;
  signedIn: boolean;
  authStateReady: boolean;
}) {
  const accountsAvailable = useAuthFeatureAvailable();
  const [dismissedAt, setDismissedAt] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setDismissedAt(readDismissedAt(window.localStorage.getItem(DISMISSAL_KEY)));
  }, []);

  const visible = dismissedAt !== undefined && authStateReady && shouldShowGuestProgressProtection({
    accountsAvailable,
    signedIn,
    meaningfulEvidenceCount,
    dismissedAtEvidenceCount: dismissedAt,
  });
  if (!visible) return null;

  function dismiss() {
    const value = Math.max(0, meaningfulEvidenceCount);
    try {
      window.localStorage.setItem(DISMISSAL_KEY, JSON.stringify({ version: 1, dismissedAtEvidenceCount: value }));
    } catch {
      // A failed preference write should not affect learning progress.
    }
    setDismissedAt(value);
  }

  return (
    <aside data-testid="guest-progress-protection" className="relative border-y border-forge/20 bg-forge-soft/35 px-3 py-3 pr-12" aria-labelledby="guest-progress-protection-title">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-[220px] flex-1">
          <h2 id="guest-progress-protection-title" className="m-0 text-sm font-extrabold">Protect your browser progress</h2>
          <p className="mb-0 mt-0.5 text-xs leading-relaxed text-muted">Your progress currently lives on this browser. You can keep learning as a guest.</p>
        </div>
        <Link href={accountHrefFor("/dashboard")} className="inline-flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-extrabold text-forge">
          Review account options
        </Link>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss account protection reminder" className="absolute right-2 top-2 grid size-10 place-items-center rounded-lg text-muted hover:bg-white">
        <X className="size-5" />
      </button>
    </aside>
  );
}

function readDismissedAt(raw: string | null) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { version?: unknown; dismissedAtEvidenceCount?: unknown };
    return value.version === 1 && Number.isInteger(value.dismissedAtEvidenceCount) && Number(value.dismissedAtEvidenceCount) >= 0
      ? Number(value.dismissedAtEvidenceCount)
      : null;
  } catch {
    return null;
  }
}
