import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { withCurrentAccountState } from "@/lib/account-state/current-account-state.server";
import { assessmentContentFingerprint } from "@/lib/account-state/assessment-fingerprint.server";
import { MAX_ACCOUNT_STATE_REQUEST_BYTES, normalizeAccountLearnerState, type AccountStateMutation } from "@/lib/account-state/types";
import { utcWeekStart } from "@/lib/study-plan/dates";
import { isProgressImportSameOrigin } from "@/lib/progress/import-http";
import { parseBoundedJsonRequest } from "@/lib/security/request-boundary";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" };

export async function POST(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return failure(401, "sign_in_required");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) return failure(403, "forbidden");
  const parsed = await parseBoundedJsonRequest(request, MAX_ACCOUNT_STATE_REQUEST_BYTES);
  if (!parsed.ok) return failure(parsed.status, "invalid_request");
  const guest = normalizeAccountLearnerState(parsed.value.state);
  try {
    const result = await withCurrentAccountState(async (ownerId, repository) => {
      const remote = await repository.read(ownerId);
      const now = new Date().toISOString();
      const mutations: AccountStateMutation[] = [];
      if (!remote.settings && guest.settings) mutations.push({ kind: "settings_replace", settings: {
        weeklyMinutes: guest.settings.weeklyMinutes, availableDays: guest.settings.availableDays }, changedAt: now });
      const remoteFingerprints = new Set(remote.assessments.map((entry) => assessmentContentFingerprint(entry.assessment)));
      for (const entry of guest.assessments) {
        const fingerprint = assessmentContentFingerprint(entry.assessment);
        if (!remoteFingerprints.has(fingerprint)) {
          mutations.push({ kind: "assessment_upsert", assessment: entry.assessment, changedAt: now });
          remoteFingerprints.add(fingerprint);
        }
      }
      const remoteRatings = new Set(remote.ratings.map((entry) => entry.skillPathId));
      for (const rating of guest.ratings) if (!remoteRatings.has(rating.skillPathId)) mutations.push({ kind: "confidence_upsert",
        skillPathId: rating.skillPathId, level: rating.level, setAt: rating.setAt, changedAt: now });
      const remoteOverrides = new Set(remote.overrides.map((entry) => entry.skillPathId));
      for (const override of guest.overrides) if (!remoteOverrides.has(override.skillPathId)) mutations.push({ kind: "override_upsert", override, changedAt: now });
      const currentWeek = utcWeekStart(new Date());
      const remotePlan = new Set(remote.planItems.map((entry) => `${entry.weekStart}:${entry.plannerVersion}:${entry.itemKey}`));
      for (const item of guest.planItems) {
        const key = `${item.weekStart}:${item.plannerVersion}:${item.itemKey}`;
        if (item.weekStart === currentWeek && item.plannerVersion === 1 && !remotePlan.has(key)) {
          const { changedAt: _, ...input } = item;
          mutations.push({ kind: "plan_item_upsert", item: input, changedAt: now });
        }
      }
      return { state: mutations.length ? await repository.apply(ownerId, mutations) : remote, importedCount: mutations.length };
    });
    if (!result.authenticated) return failure(401, "sign_in_required");
    return NextResponse.json({ protocolVersion: 1, authenticated: true, ...result.result }, { headers });
  } catch {
    return failure(503, "temporarily_unavailable");
  }
}

function failure(status: number, error: string) {
  return NextResponse.json({ protocolVersion: 1, error }, { status, headers });
}
