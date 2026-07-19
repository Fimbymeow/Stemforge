"use client";

import {
  BETA_REPORT_GUEST_ID_KEY,
  BETA_REPORT_RECEIPTS_KEY,
  MAX_REPORT_RECEIPTS,
  type BetaReportReceipt,
} from "@/lib/beta-reports/report-types";

export function getOrCreateGuestReportSessionId(storage: Storage | null = safeStorage()) {
  if (!storage) return null;
  let existing: string | null;
  try { existing = storage.getItem(BETA_REPORT_GUEST_ID_KEY); } catch { return null; }
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  const created = `guest_${browserRandomId()}`;
  try { storage.setItem(BETA_REPORT_GUEST_ID_KEY, created); return created; } catch { return null; }
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
  try {
    storage.setItem(BETA_REPORT_RECEIPTS_KEY, JSON.stringify(next));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("stemforge:beta-report-receipts-updated"));
    return true;
  } catch { return false; }
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

function browserRandomId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID().replaceAll("-", "");
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues(bytes);
  if (bytes.some((value) => value !== 0)) return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
}
