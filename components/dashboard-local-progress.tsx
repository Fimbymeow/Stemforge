"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  ClipboardList,
  Clock3,
  Flame,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { useProgressSync } from "@/components/progress-sync-provider";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import {
  deriveLearnerDashboardModel,
  type DashboardActivityItem,
  type DashboardFocusItem,
  type DashboardPathSummary,
} from "@/lib/dashboard-derivations";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { ProgressEvidence } from "@/lib/progress/types";
import { GuestProgressProtection } from "@/components/account/guest-progress-protection";

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

  const model = useMemo(() => {
    return deriveLearnerDashboardModel({
      evidence,
      sync: {
        status: sync.status,
        pendingCount: sync.pendingCount,
        lastSuccessfulSyncAt: sync.lastSuccessfulSyncAt,
        differentAccount: sync.differentAccount,
        accountFingerprint: sync.accountFingerprint,
      },
    });
  }, [
    evidence,
    sync.status,
    sync.pendingCount,
    sync.lastSuccessfulSyncAt,
    sync.differentAccount,
    sync.accountFingerprint,
  ]);

  const recommendedPath = model.paths.find((path) => path.skillPathId === recommendation.pathId);
  const supportingStat = recommendedPath
    ? `${recommendedPath.completedQuestions} / ${recommendedPath.totalQuestions} completed`
    : recommendation.reason;
  const hasLearningActivity = model.course.startedPathCount > 0;
  const meaningfulEvidenceCount = evidence.attempts.length + evidence.achievementSnapshots.length;

  return (
    <section className="grid gap-4" aria-label="Your learning dashboard">
      <Card data-testid="dashboard-progress-summary" className="border-forge/30 bg-gradient-to-br from-forge/10 via-white to-white p-5 md:p-6">
        <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 max-md:grid-cols-1">
          <div className="grid size-16 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-16 max-md:w-full">
            <Target className="size-7" />
          </div>
          <div>
            <span className="mb-2 inline-flex rounded-full bg-forge-soft px-3 py-1 text-xs font-extrabold uppercase text-forge">Best next step</span>
            <h2 className="m-0 text-2xl font-extrabold md:text-3xl">{recommendation.title}</h2>
            <p id="dashboard-next-action-reason" className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{recommendation.reason}</p>
          </div>
          {recommendation.href ? <DashboardAction href={recommendation.href}>{recommendation.label}</DashboardAction> : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-forge/20 pt-4 text-sm font-bold text-muted">
          <span>{supportingStat}</span>
          <span>{model.sync.label}</span>
        </div>
      </Card>

      <GuestProgressProtection
        meaningfulEvidenceCount={meaningfulEvidenceCount}
        signedIn={sync.accountFingerprint !== null}
        authStateReady={sync.status === "authentication_required"}
      />

      {hasLearningActivity ? <><div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-extrabold">Course progress</h2>
              <p className="mt-1 text-sm text-muted">{model.course.notice}</p>
            </div>
            <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-muted">
              {model.course.startedPathCount} started · {model.course.securePathCount} secure
            </span>
          </div>
          <div className="grid gap-4">
            {model.paths.map((path) => <PathEvidenceRow key={path.skillPathId} path={path} />)}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><Clock3 className="size-5 text-forge" /> Recent activity</h2>
            <ActivityList items={model.recentActivity} />
          </Card>

          <Card className="p-5">
            <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><Flame className="size-5 text-forge" /> Weekly activity</h2>
            <p className="mt-2 text-sm text-muted">{model.weeklyActivity.label}</p>
            {hasWeeklyActivity(model.weeklyActivity) ? (
              <div className={`mt-4 grid gap-2 text-center ${model.weeklyActivity.achievements > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                <MiniStat label="Days" value={model.weeklyActivity.activeDays} />
                <MiniStat label="Attempts" value={model.weeklyActivity.attempts} />
                {model.weeklyActivity.achievements > 0 ? <MiniStat label="Milestones" value={model.weeklyActivity.achievements} /> : null}
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Card className="p-5">
          <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><TrendingUp className="size-5 text-forge" /> Needs work</h2>
          <FocusList items={model.needsWork} empty="No weak spots yet. Start a path to see recommendations here." />
        </Card>

        <Card className="p-5">
          <h2 className="m-0 flex items-center gap-2 text-xl font-extrabold"><ShieldCheck className="size-5 text-forge" /> Secure and mastered</h2>
          {model.secureAndMastered.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-4 text-sm font-semibold text-muted">
              Nothing secure yet. Complete questions on your own to reach Secure status.
            </p>
          ) : (
            <div className="mt-4 grid gap-2">
              {model.secureAndMastered.map((item) => (
                <Link key={item.id} href={item.href} className="rounded-xl border border-line bg-white p-3 transition duration-150 ease-out hover:-translate-y-0.5 hover:border-forge">
                  <span className="text-sm font-extrabold">{item.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-muted">{item.detail}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
      </> : null}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-extrabold">Quick links</h2>
            <p className="mt-1 text-sm text-muted">Jump to practice and resources without affecting your progress.</p>
          </div>
          <div className="grid grow grid-cols-3 gap-2 max-md:grid-cols-1 md:max-w-3xl">
            {model.quickLinks.map((link) => link.href === "/practice" ? (
              <QuickPracticeAction
                key={link.href}
                preferredPathId={recommendation.pathId}
                label="Quick Practice"
                className="min-h-16 justify-between !rounded-xl px-4 text-left"
              />
            ) : (
              <QuickLink key={link.href} href={link.href} icon={quickLinkIcon(link.title)}>
                <span>{link.title}</span>
                <small>{link.detail}</small>
              </QuickLink>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function hasWeeklyActivity(activity: { activeDays: number; attempts: number; achievements: number }) {
  return activity.activeDays > 0 || activity.attempts > 0 || activity.achievements > 0;
}

function PathEvidenceRow({ path }: { path: DashboardPathSummary }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4" data-testid={`dashboard-path-${path.skillPathId}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-extrabold">{path.name}</h3>
          <p className="mt-1 text-sm text-muted">{path.currentStageName ? `Current stage: ${path.currentStageName}` : path.description}</p>
        </div>
        <Link href={path.href} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-extrabold text-ink">View path</Link>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1">
        <ProgressBar value={path.completionPercentage} />
        <strong className="text-sm text-muted">{path.completedQuestions} / {path.totalQuestions}</strong>
      </div>
      <div className="mt-3 grid gap-2">
        {path.stageSummaries.map((stage) => (
          <div key={stage.stageId} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-2 max-sm:grid-cols-1">
            <span className="text-xs font-extrabold text-muted">{stage.name}</span>
            <ProgressBar value={stage.completionPercentage} className="h-2" />
            <span className="text-xs font-bold text-muted">{formatStatus(stage.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityList({ items }: { items: DashboardActivityItem[] }) {
  if (items.length === 0) {
    return <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-4 text-sm font-semibold text-muted">No recent activity yet. Your first answered question will appear here.</p>;
  }
  return (
    <div className="mt-4 grid gap-2">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="rounded-xl border border-line bg-white p-3 transition duration-150 ease-out hover:-translate-y-0.5 hover:border-forge">
          <span className="text-sm font-extrabold">{item.title}</span>
          <span className="mt-1 block text-xs font-semibold text-muted">{item.detail}</span>
        </Link>
      ))}
    </div>
  );
}

function FocusList({ items, empty }: { items: DashboardFocusItem[]; empty: string }) {
  if (items.length === 0) return <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-4 text-sm font-semibold text-muted">{empty}</p>;
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="text-xs font-bold uppercase text-muted">{label}</span>
    </div>
  );
}

function DashboardAction({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link href={href} aria-describedby="dashboard-next-action-reason" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
      {children}
    </Link>
  );
}

function QuickLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 rounded-xl border border-line bg-white px-3 text-sm font-bold transition duration-150 ease-out hover:-translate-y-0.5 hover:border-forge hover:text-forge">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forge-soft text-forge">{icon}</span>
      <span className="grid gap-0.5 [&_small]:text-xs [&_small]:font-semibold [&_small]:text-muted">{children}</span>
    </Link>
  );
}

function quickLinkIcon(title: string) {
  if (title.includes("Question")) return <ClipboardList className="size-5" />;
  if (title.includes("Formula")) return <Award className="size-5" />;
  return <BookOpen className="size-5" />;
}

function formatStatus(status: string) {
  return status.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
