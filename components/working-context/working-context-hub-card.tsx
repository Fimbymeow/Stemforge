"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";

export function WorkingContextHubCard({ pathId }: { pathId: string | null }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return <section aria-label="Learn" data-testid="working-context-hub" className="rounded-sm border border-rule bg-white p-5 md:p-6">
    <h3 className="text-xl font-semibold text-navy">Explore Higher Maths</h3>
    <p className="mt-2 text-sm text-secondary">Choose a skill from the course units below.</p>
    <Link href="#unit-navigation-title" className="orthic-secondary-link mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-navy">Explore course skills <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
  </section>;
  const notesCurrent = Boolean(model.notesHref && model.primaryHref === model.notesHref && !model.isComplete);

  return (
    <section aria-label="Learn" className="rounded-sm border border-rule bg-white p-5 md:p-6" data-testid="working-context-hub">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 max-md:grid-cols-1">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">{model.status === "not_started" ? "Start learning" : "Continue learning"}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-navy">
            <Link href={model.overviewHref} className="orthic-secondary-link rounded-sm">{model.skillName}</Link>
          </h3>
        </div>
        <div className="flex min-w-[210px] flex-col justify-center gap-1 max-md:min-w-0">
          <Link href={model.primaryHref} className="orthic-primary-action inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-sm bg-navy px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
            {model.primaryLabel}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" />
          </Link>
          <Link href={model.overviewHref} className="orthic-secondary-link inline-flex min-h-11 items-center justify-center text-sm text-secondary">View skill overview</Link>
        </div>
      </div>
      <ol aria-label="Learning stages" className="mt-5 grid grid-cols-1 divide-y divide-rule border-y border-rule sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <li aria-current={notesCurrent ? "step" : undefined} className={`orthic-stage px-3 py-3 text-sm ${notesCurrent ? "bg-academic-blue" : ""}`}><span className="block font-medium text-navy">Notes</span><span className="mt-1 block text-xs text-secondary">{model.notesHref ? "Available" : "Unavailable"}</span></li>
        {["Foundations", "Applications", "Past Paper-style Questions"].map((name) => {
          const stage = model.stages.find((item) => item.name === name);
          const complete = Boolean(stage && stage.total > 0 && stage.completed >= stage.total);
          const current = Boolean(stage && !complete && !model.isComplete && !notesCurrent && model.stageName === name);
          return <li key={name} aria-current={current ? "step" : undefined} className={`orthic-stage px-3 py-3 text-sm ${current ? "bg-academic-blue text-navy" : "text-secondary"}`}>
            <span className="block font-medium">{name === "Past Paper-style Questions" ? "Exam practice" : name}</span>
            <span className="mt-1 block text-xs">{stage && stage.total > 0 ? `${stage.completed}/${stage.total} · ${complete ? "Complete" : current ? "Current" : stage.completed > 0 ? "In progress" : "Available"}` : "Unavailable"}</span>
          </li>;
        })}
      </ol>
    </section>
  );
}
