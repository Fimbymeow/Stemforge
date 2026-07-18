"use client";

import { useEffect, useState } from "react";
import { readBetaReportReceipts } from "@/lib/beta-reports/report-receipts";
import type { BetaReportReceipt } from "@/lib/beta-reports/report-types";

export function BetaReportReceipts() {
  const [receipts, setReceipts] = useState<BetaReportReceipt[]>([]);

  useEffect(() => {
    const update = () => setReceipts(readBetaReportReceipts());
    update();
    window.addEventListener("storage", update);
    window.addEventListener("stemforge:beta-report-receipts-updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("stemforge:beta-report-receipts-updated", update);
    };
  }, []);

  if (receipts.length === 0) return null;
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-lg font-extrabold">Your recent beta reports</h2>
      <p className="mt-1 text-sm text-muted">Saved report references on this browser. Message text is not stored here.</p>
      <ul className="mt-3 grid gap-2">
        {receipts.slice(0, 5).map((receipt) => (
          <li key={receipt.reportId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-sm">
            <span className="font-bold">{receipt.reportId}</span>
            <span className="text-muted">{receipt.kind.replaceAll("_", " ")} · {receipt.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
