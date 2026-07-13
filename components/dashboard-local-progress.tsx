"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, FileText, MessageSquare, Target } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { BETA_FEEDBACK_URL } from "@/lib/beta";
import { getActiveContinueHref, getActiveSkillPath, getQuestionBankHref, getResourceHref } from "@/lib/learning-paths";
import { getEmptyProgressEvidence, getNextQuestionId, getSkillPathProgress } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";

export function DashboardLocalProgressSection() {
  const skillPath = getActiveSkillPath();
  const [version, setVersion] = useState(0);
  const hasMounted = useHasMounted();

  useEffect(() => {
    const update = () => setVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  void version;
  const evidenceOverride = hasMounted ? undefined : getEmptyProgressEvidence();
  const progress = getSkillPathProgress(skillPath, evidenceOverride);
  const nextQuestionId = getNextQuestionId(skillPath, evidenceOverride);
  const nextHref = getActiveContinueHref(nextQuestionId);
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;

  return (
    <section className="grid gap-4">
      <Card data-testid="dashboard-progress-summary" className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-5 md:p-6">
        <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 max-md:grid-cols-1">
          <div className="grid size-16 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-16 max-md:w-full">
            <Target className="size-7" />
          </div>
          <div>
            <span className="mb-2 inline-flex rounded-full bg-forge-soft px-3 py-1 text-xs font-extrabold uppercase text-forge">Higher Maths</span>
            <h2 className="m-0 text-2xl font-extrabold md:text-3xl">Continue {skillPath.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {isComplete ? "You have completed every question in this local path. Review the path or reset progress when testing." : "Pick up from your next incomplete Basic differentiation question."}
            </p>
          </div>
          <DashboardAction href={nextHref}>{isComplete ? "Review path" : "Continue"}</DashboardAction>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 max-sm:grid-cols-1">
          <ProgressBar value={progress.completionPercentage} />
          <strong className="text-sm text-muted">{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</strong>
        </div>
        <p className="mt-3 text-xs font-semibold text-muted">Progress saved on this browser. No account needed. Local progress only.</p>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-extrabold">Progress summary</h2>
              <p className="mt-1 text-sm text-muted">One compact view of your current path.</p>
            </div>
            <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-muted">{progress.completionPercentage}% complete · {formatStatus(progress.status)}</span>
          </div>
          <div className="grid gap-3">
            {skillPath.learningStages?.map((stage) => {
              const stageProgress = progress.stageProgress[stage.id];
              return (
                <div key={stage.id} className="grid grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1">
                  <span className="font-bold">{stage.name}</span>
                  <ProgressBar value={stageProgress?.completionPercentage ?? 0} />
                  <strong className="text-sm text-muted">{stageProgress?.completedQuestionIds.length ?? 0} / {stage.questionIds.length}</strong>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="m-0 text-xl font-extrabold">Quick links</h2>
          <div className="mt-4 grid gap-2">
            <QuickLink href={skillPath.href} icon={<Target className="size-5" />}>Open path</QuickLink>
            <QuickLink href={getQuestionBankHref()} icon={<ClipboardList className="size-5" />}>Question bank</QuickLink>
            <QuickLink href={getResourceHref("revision-notes")} icon={<FileText className="size-5" />}>Revision notes</QuickLink>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <h2 className="m-0 text-xl font-extrabold">Private beta feedback</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">Spot something confusing, broken, or slow? Send quick feedback so STEM Forge can improve before more students test it.</p>
            </div>
          </div>
          <Link href={BETA_FEEDBACK_URL} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold transition hover:border-forge hover:text-forge max-sm:w-full">
            Give feedback
          </Link>
        </div>
      </Card>
    </section>
  );
}

function formatStatus(status: string) {
  return status.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function DashboardAction({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
      {children}
    </Link>
  );
}

function QuickLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-3 text-sm font-bold transition duration-150 ease-out hover:-translate-y-0.5 hover:border-forge hover:text-forge">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forge-soft text-forge">{icon}</span>
      {children}
    </Link>
  );
}
