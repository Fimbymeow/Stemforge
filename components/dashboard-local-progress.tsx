"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { useProgressSync } from "@/components/progress-sync-provider";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
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

  const recommendedPath = model.paths.find((path) => path.skillPathId === recommendation.pathId);
  const hasLearningActivity = model.course.startedPathCount > 0;
  const meaningfulEvidenceCount = evidence.attempts.length + evidence.achievementSnapshots.length;

  return (
    <section className="grid gap-4" aria-label="Your learning dashboard">
      <Card data-testid="dashboard-progress-summary" className="border-forge/30 bg-gradient-to-br from-forge/10 via-white to-white p-5 md:p-6">
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-4 max-md:grid-cols-1">
          <div className="grid size-16 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-14 max-md:w-full">
            <Target className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Higher Maths</p>
            <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
              <Link href={HIGHER_MATHS_HREF} className="rounded-sm hover:text-forge focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forge">
                Higher Maths
              </Link>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{model.course.notice}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-forge/20 bg-white/80 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Recommended next</p>
          <h3 className="mt-1 text-lg font-extrabold">{recommendation.title}</h3>
          <p id="dashboard-next-action-reason" className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{recommendation.reason}</p>
        </div>

        {hasLearningActivity ? (
          <div className="mt-4 grid gap-2 border-t border-forge/20 pt-4" data-testid="dashboard-course-progress">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-muted">
              <span>{recommendedPath?.currentStageName ? `Current position: ${recommendedPath.currentStageName}` : "Current Higher Maths progress"}</span>
              <span>{model.course.completedQuestions} / {model.course.totalQuestions} completed</span>
            </div>
            <ProgressBar value={model.course.completionPercentage} />
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-forge/20 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href={HIGHER_MATHS_HREF} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
            Open Higher Maths
            <ArrowRight className="size-4" />
          </Link>
          {recommendation.href ? (
            <Link href={recommendation.href} aria-describedby="dashboard-next-action-reason" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-forge bg-white px-5 text-sm font-extrabold text-forge">
              {recommendation.label}
            </Link>
          ) : null}
          <span className="text-sm font-bold text-muted sm:ml-auto">
            {!hasLearningActivity ? `${model.course.completedQuestions} / ${model.course.totalQuestions} completed · ` : null}
            {model.sync.label}
          </span>
        </div>
      </Card>

      <Card data-testid="dashboard-quick-practice" className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-xl font-extrabold">Quick Practice</h2>
            <p id="dashboard-quick-practice-reason" className="mt-1 text-sm leading-relaxed text-muted">
              Start a short untimed session from the most relevant available path.
            </p>
          </div>
          <QuickPracticeAction
            preferredPathId={recommendation.pathId}
            label="Start Quick Practice"
            describedBy="dashboard-quick-practice-reason"
            className="shrink-0 sm:min-w-48"
          />
        </div>
      </Card>

      <GuestProgressProtection
        meaningfulEvidenceCount={meaningfulEvidenceCount}
        signedIn={sync.accountFingerprint !== null}
        authStateReady={sync.status === "authentication_required"}
      />

      {model.needsWork.length > 0 || model.secureAndMastered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          {model.needsWork.length > 0 ? (
            <Card className="p-5">
              <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><TrendingUp className="size-5 text-forge" /> Needs work</h2>
              <FocusList items={model.needsWork} />
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
