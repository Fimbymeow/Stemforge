import type { ReactNode } from "react";
import Link from "next/link";
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
    <FocusedProductShell>
      <Card className="p-6 sm:p-9">
        <h1 className="m-0 text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{introduction}</p>
        {code ? <AccountResultMessage code={code} message={AUTH_RESULT_MESSAGES[code]} /> : null}
        {children}
      </Card>
      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        Accounts are optional and learning works without one. Signing in never uploads browser progress automatically.
        Adding this browser&apos;s progress to your account, and keeping progress updated across devices, are separate choices you make yourself.
      </p>
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
