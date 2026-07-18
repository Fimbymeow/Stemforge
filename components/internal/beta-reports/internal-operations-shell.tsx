import Link from "next/link";
import type { ReactNode } from "react";

export function InternalOperationsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-forge">Restricted operations</p>
            <p className="text-lg font-extrabold">STEM Forge private beta triage</p>
          </div>
          <nav aria-label="Internal operations">
            <Link href="/internal/beta-reports" className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-bold">Report queue</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
