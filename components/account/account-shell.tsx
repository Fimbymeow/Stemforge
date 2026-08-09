import type { ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import { AUTH_RESULT_MESSAGES, readAuthResultCode } from "@/lib/auth/results";
import { CurrentBrowserExportButton } from "@/components/account/account-learning-data";
import { AccountResultMessage } from "@/components/account/account-result-message";
import { FocusedProductShell } from "@/components/layout/focused-product-shell";

export function AccountShell({
  title,
  introduction,
  result,
  children,
}: {
  title: string;
  introduction: string;
  result?: unknown;
  children: ReactNode;
}) {
  const code = readAuthResultCode(result);
  return (
    <FocusedProductShell maxWidth="max-w-2xl">
      <Card className="p-6 sm:p-9">
        <header className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge"><UserRound aria-hidden="true" className="size-6" /></span>
          <div>
            <h1 className="m-0 text-3xl font-extrabold">{title}</h1>
            <p className="mt-2 leading-relaxed text-muted">{introduction}</p>
          </div>
        </header>
        {code ? <AccountResultMessage code={code} message={AUTH_RESULT_MESSAGES[code]} /> : null}
        {children}
      </Card>
      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        Accounts are optional. Signing in does not upload this browser&apos;s progress automatically.
        Adding browser progress and turning on cross-device sync are separate choices.
      </p>
      <nav aria-label="Account legal information" className="mt-3 flex justify-center gap-5 text-sm font-semibold text-forge underline">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </FocusedProductShell>
  );
}

export function AccountUnavailable() {
  return (
    <AccountShell title="Accounts are not available" introduction="Accounts aren't available right now.">
      <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-6 text-sm font-extrabold text-white">
        Continue as a guest
      </Link>
      <CurrentBrowserExportButton />
    </AccountShell>
  );
}

export const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-4 text-base outline-none focus:border-forge focus:ring-2 focus:ring-forge-soft";
export const buttonClass = "mt-6 min-h-12 w-full rounded-lg bg-forge px-6 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60";
