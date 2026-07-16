import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui";
import { AUTH_RESULT_MESSAGES, readAuthResultCode } from "@/lib/auth/results";

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
    <main className="min-h-screen bg-paper px-4 py-10 text-ink sm:py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="mx-auto mb-8 block w-44" aria-label="STEM Forge home">
          <Image src="/assets/stemforge-logo-header.png" alt="STEM Forge" width={300} height={91} priority />
        </Link>
        <Card className="p-6 sm:p-9">
          <h1 className="m-0 text-3xl font-extrabold">{title}</h1>
          <p className="mt-3 leading-relaxed text-muted">{introduction}</p>
          {code ? <p role="status" className="mt-5 rounded-lg border border-line bg-forge-soft p-4 text-sm font-semibold">{AUTH_RESULT_MESSAGES[code]}</p> : null}
          {children}
        </Card>
        <p className="mt-6 text-center text-sm leading-relaxed text-muted">
          Accounts are optional. Learning works without one, and existing progress remains stored only in this browser.
          Signing in never uploads it automatically. Confirmed imports add evidence to an account; continuous cross-device sync is not active yet.
        </p>
      </div>
    </main>
  );
}

export function AccountUnavailable() {
  return (
    <AccountShell title="Accounts are not available" introduction="The optional account preview is disabled or has not been configured for this environment.">
      <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-forge px-6 text-sm font-extrabold uppercase text-white">
        Continue as a guest
      </Link>
    </AccountShell>
  );
}

export const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-4 text-base outline-none focus:border-forge focus:ring-2 focus:ring-forge-soft";
export const buttonClass = "mt-6 min-h-12 w-full rounded-md bg-forge px-6 text-sm font-extrabold uppercase text-white disabled:cursor-wait disabled:opacity-60";
