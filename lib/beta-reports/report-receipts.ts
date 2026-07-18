"use client";

import {
  BETA_REPORT_GUEST_ID_KEY,
  BETA_REPORT_RECEIPTS_KEY,
  MAX_REPORT_RECEIPTS,
  type BetaReportReceipt,
} from "@/lib/beta-reports/report-types";

export function getOrCreateGuestReportSessionId(storage: Storage | null = safeStorage()) {
  if (!storage) return null;
  const existing = storage.getItem(BETA_REPORT_GUEST_ID_KEY);
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  const created = `guest_${crypto.randomUUID().replaceAll("-", "")}`;
  storage.setItem(BETA_REPORT_GUEST_ID_KEY, created);
  return created;
}

export function readBetaReportReceipts(storage: Storage | null = safeStorage()): BetaReportReceipt[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(BETA_REPORT_RECEIPTS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReceipt).slice(0, MAX_REPORT_RECEIPTS);
  } catch {
    return [];
  }
}

export function recordBetaReportReceipt(receipt: BetaReportReceipt, storage: Storage | null = safeStorage()) {
  if (!storage) return false;
  const next = [receipt, ...readBetaReportReceipts(storage).filter((item) => item.reportId !== receipt.reportId)].slice(0, MAX_REPORT_RECEIPTS);
  storage.setItem(BETA_REPORT_RECEIPTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("stemforge:beta-report-receipts-updated"));
  return true;
}

function isReceipt(value: unknown): value is BetaReportReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<BetaReportReceipt>;
  return typeof receipt.reportId === "string" &&
    typeof receipt.kind === "string" &&
    typeof receipt.createdAt === "string" &&
    (receipt.pageArea === null || typeof receipt.pageArea === "string") &&
    (receipt.source === "guest" || receipt.source === "authenticated") &&
    typeof receipt.status === "string";
}

function safeStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
