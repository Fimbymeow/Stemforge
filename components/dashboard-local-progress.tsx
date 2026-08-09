"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { useProgressSync } from "@/components/progress-sync-provider";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import {
  deriveLearnerDashboardModel,
  type DashboardFocusItem,
} from "@/lib/dashboard-derivations";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { ProgressEvidence } from "@/lib/progress/types";
import { GuestProgressProtection } from "@/components/account/guest-progress-protection";

const HIGHER_MATHS_HREF = "/subjects/higher-maths";

export function DashboardLocalProgressSection() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const sync = useProgressSync();
  const recommendation = useLearnerNextAction();

  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const model = useMemo(() => deriveLearnerDashboardModel({
    evidence,
    sync: {
      status: sync.status,
      pendingCount: sync.pendingCount,
      lastSuccessfulSyncAt: sync.lastSuccessfulSyncAt,
      differentAccount: sync.differentAccount,
      accountFingerprint: sync.accountFingerprint,
    },
  }), [
    evidence,
    sync.status,
    sync.pendingCount,
    sync.lastSuccessfulSyncAt,
    sync.differentAccount,
    sync.accountFingerprint,
  ]);

  const meaningfulEvidenceCount = evidence.attempts.length + evidence.achievementSnapshots.length;
  const recommendedPath = model.paths.find((path) => path.skillPathId === recommendation.pathId) ?? null;
  const recommendedStage = recommendation.stageId
    ? recommendedPath?.stageSummaries.find((stage) => stage.stageId === recommendation.stageId) ?? null
    : null;

  return (
    <section className="grid gap-4" aria-label="Your learning dashboard">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(240px,1fr)] items-stretch gap-4 max-lg:grid-cols-1">
        <Card data-testid="dashboard-progress-summary" aria-label="Learn" className="border-forge/30 bg-gradient-to-br from-forge/10 via-white to-white p-5 md:p-6">
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-4 max-md:grid-cols-1">
            <div className="grid size-16 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-14 max-md:w-full">
              <Target className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Learn · Higher Maths</p>
              <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">{recommendedPath?.name ?? "Higher Maths"}</h2>
              {recommendedStage ? (
                <p className="mt-2 text-sm font-bold text-muted" data-testid="dashboard-current-stage">
                  {recommendedStage.name} &middot; {recommendedStage.completedQuestions} of {recommendedStage.totalQuestions} complete
                </p>
              ) : null}
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{recommendation.reason}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-forge/20 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
            {recommendation.href ? (
              <Link href={recommendation.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
                {recommendation.label}<ArrowRight className="size-4" />
              </Link>
            ) : null}
            <Link href={HIGHER_MATHS_HREF} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-extrabold text-ink">
              Open Higher Maths
            </Link>
            <span className="text-sm font-bold text-muted sm:ml-auto">
              {model.sync.label}
            </span>
          </div>
        </Card>

        <PracticeEntryCard preferredPathId={recommendation.pathId} testId="dashboard-practice" />
      </div>

      <GuestProgressProtection
        meaningfulEvidenceCount={meaningfulEvidenceCount}
        signedIn={sync.accountFingerprint !== null}
        authStateReady={sync.status === "authentication_required"}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-muted" data-testid="dashboard-activity-line">
        {model.weeklyActivity.activeDays > 0 ? <span className="font-semibold">{model.weeklyActivity.label}</span> : null}
        <Link href="/activity" className="font-bold text-forge underline decoration-forge/30 underline-offset-4 hover:decoration-forge">
          View your activity <span aria-hidden="true">→</span>
        </Link>
      </div>

      {model.needsWork.length > 0 || model.mistakes.openCount > 0 || model.secureAndMastered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          {model.needsWork.length > 0 || model.mistakes.openCount > 0 ? (
            <Card className="p-5">
              <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><TrendingUp className="size-5 text-forge" /> Needs work</h2>
              {model.mistakes.openCount > 0 ? (
                <Link href={model.mistakes.href} data-testid="dashboard-mistakes-link" className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 text-sm font-extrabold transition hover:border-forge">
                  <span>{model.mistakes.openCount} unresolved mistake{model.mistakes.openCount === 1 ? "" : "s"}</span>
                  <ArrowRight aria-hidden="true" className="size-4 text-forge" />
                </Link>
              ) : null}
              {model.needsWork.length > 0 ? <FocusList items={model.needsWork} /> : null}
            </Card>
          ) : null}

          {model.secureAndMastered.length > 0 ? (
            <Card className="border-line/80 bg-paper/50 p-5">
              <h2 className="m-0 flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="size-5 text-forge" /> Secure and mastered</h2>
              <div className="mt-3 grid gap-2">
                {model.secureAndMastered.map((item) => (
                  <Link key={item.id} href={item.href} className="rounded-xl border border-line bg-white p-3 transition duration-150 ease-out hover:border-forge">
                    <span className="text-sm font-extrabold">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold text-muted">{item.detail}</span>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FocusList({ items }: { items: DashboardFocusItem[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {items.map((item) => (
        <Link key={item.pathId} href={item.href} className="rounded-xl border border-line bg-white p-3 transition duration-150 ease-out hover:-translate-y-0.5 hover:border-forge">
          <span className="text-sm font-extrabold">{item.title}</span>
          <span className="mt-1 block text-xs font-semibold text-muted">{item.detail}</span>
        </Link>
      ))}
    </div>
  );
}
