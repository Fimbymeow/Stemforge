import type { ReactNode } from "react";
import Link from "next/link";
import { FocusedProductShell } from "@/components/layout/focused-product-shell";

export function LegalPage({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <FocusedProductShell maxWidth="max-w-3xl">
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-10">
        <p className="m-0 text-sm font-bold text-forge">Public-beta information</p>
        <h1 className="mb-0 mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{summary}</p>
        <p className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm leading-relaxed text-ink">
          This public-beta draft describes the product as it works today. Formal legal review, including operator and contact details, is required before public launch.
        </p>
        <p className="text-sm text-muted">Last updated: 9 August 2026</p>
        <div className="legal-copy mt-8 space-y-8 leading-relaxed text-ink">{children}</div>
      </article>
      <nav aria-label="Legal information" className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-semibold text-forge underline">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/">Home</Link>
      </nav>
    </FocusedProductShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-2 text-xl font-extrabold">{title}</h2><div className="space-y-3 text-muted">{children}</div></section>;
}
