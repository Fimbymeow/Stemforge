export const PREMIUM_PREVIEW_STORAGE_KEY = "orthic.premiumPreview.v1";
export const PREMIUM_PREVIEW_UPDATED_EVENT = "orthic:premium-preview-updated";

type PremiumPreviewStorage = Pick<Storage, "getItem" | "setItem">;

export function isPremiumPreviewAvailable(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return environment.NODE_ENV !== "production" || environment.STEMFORGE_E2E_FIXTURES === "true";
}

export function readPremiumPreview(storage: Pick<Storage, "getItem">): boolean {
  try {
    const value = JSON.parse(storage.getItem(PREMIUM_PREVIEW_STORAGE_KEY) ?? "null") as unknown;
    return Boolean(value && typeof value === "object"
      && (value as { version?: unknown }).version === 1
      && (value as { enabled?: unknown }).enabled === true);
  } catch {
    return false;
  }
}

export function writePremiumPreview(storage: PremiumPreviewStorage, enabled: boolean): boolean {
  try {
    storage.setItem(PREMIUM_PREVIEW_STORAGE_KEY, JSON.stringify({ version: 1, enabled }));
    return true;
  } catch {
    return false;
  }
}

/** Premium Preview changes presentation and recommendations only; it is never an authorization check. */
export function premiumAssessmentContext<T>(enabled: boolean, assessments: readonly T[]): readonly T[] {
  return enabled ? assessments : [];
}
