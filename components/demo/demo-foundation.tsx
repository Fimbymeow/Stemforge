"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDemoRuntime } from "@/components/demo/demo-runtime-provider";
import { getDemoSkill, getDemoQuestions } from "@/lib/demo/content";
import { hasPreviewInteraction, previewContinueHref, previewOutcomeLabel, WALKTHROUGH_IDS } from "@/lib/demo/walkthrough";
import { DemoPathway } from "@/components/demo/demo-pathway";
import { Card } from "@/components/ui";
import { InlineMathContent } from "@/components/questions/math-content";

const primaryAction = "orthic-primary-action inline-flex min-h-11 items-center justify-center gap-3 rounded bg-navy px-6 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy";

export function DemoDashboard() {
  const runtime = useDemoRuntime();
  const [, refresh] = useState(0);
  useEffect(() => runtime.subscribe(() => refresh((value) => value + 1)), [runtime]);
  const skill = getDemoSkill()?.skillPath;
  if (!skill) return <p>Chain Rule is unavailable.</p>;
  const evidence = runtime.getEvidence();
  const hasActivity = hasPreviewInteraction(evidence);
  const activity = getDemoQuestions().filter((question) => hasPreviewInteraction(evidence, question.id));
  return <div className="grid min-w-0 gap-8 max-sm:gap-6">
    <header>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight max-sm:text-[28px]">Orthic Preview</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-secondary">Try Orthic’s Higher Maths learning experience through one complete Chain Rule skill: Notes, practice and worked solutions.</p>
    </header>
    <Card className="!rounded-lg !border-rule p-8 !shadow-none max-sm:p-5" data-testid="demo-focus-card">
      <p className="font-mono text-[11px] uppercase tracking-widest text-secondary">Higher Maths</p>
      <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight max-sm:text-[28px]">{skill.name}</h2>
      <div className="mt-4"><DemoPathway compact /></div>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-secondary"><InlineMathContent>{skill.description}</InlineMathContent></p>
      <Link className={primaryAction + " mt-6 max-sm:w-full"} href={previewContinueHref(evidence)}>{hasActivity ? "Continue Chain Rule" : "Try Chain Rule"}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
    </Card>
    <section aria-labelledby="preview-pathway-title">
      <h2 id="preview-pathway-title" className="mb-4 text-lg font-semibold">A structured learning pathway</h2>
      <DemoPathway />
    </section>
    <p className="max-w-2xl text-sm leading-relaxed text-secondary">Read the complete Notes, try a short three-question walkthrough, or explore all three practice stages. Sampling questions does not complete a stage.</p>
    {activity.length ? <section aria-labelledby="preview-activity-title">
      <h2 id="preview-activity-title" className="text-lg font-semibold">Your activity in this preview</h2>
      <ul className="mt-3 divide-y divide-rule" data-testid="preview-activity">{activity.map((question) => <li key={question.id} className="py-3 text-sm leading-relaxed">
        <Link className="orthic-secondary-link inline-flex min-h-11 items-center gap-2" href={runtime.navigation.question(question.id)!}>{question.stage === "Past Paper-style Questions" ? "Exam practice" : question.stage} · <InlineMathContent>{question.title}</InlineMathContent></Link>
        <p className="text-secondary">{previewOutcomeLabel(runtime.getQuestionProgress(question.id))}</p>
      </li>)}</ul>
    </section> : null}
  </div>;
}

export function DemoSkillFoundation() {
  const runtime = useDemoRuntime();
  const context = getDemoSkill();
  if (!context) return <p>Chain Rule is unavailable.</p>;
  return <div className="grid min-w-0 gap-8">
    <Link href={runtime.navigation.home} className="orthic-secondary-link inline-flex min-h-11 w-fit items-center gap-2 text-sm text-secondary"><ArrowLeft aria-hidden="true" className="size-4" />Preview overview</Link>
    <header className="rounded border border-rule bg-white p-7 max-sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-secondary">Higher Maths · {context.courseArea.name}</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight max-sm:text-[28px]">{context.skillPath.name}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-secondary"><InlineMathContent>{context.skillPath.description}</InlineMathContent></p>
      <Link className={primaryAction + " mt-6 max-sm:w-full"} href={runtime.navigation.notes}>Read Notes<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
      <Link className="orthic-secondary-link mt-3 inline-flex min-h-11 items-center px-3 text-sm text-secondary max-sm:px-0" href={runtime.navigation.question(WALKTHROUGH_IDS[0])!}>Take the short walkthrough →</Link>
    </header>
    <section aria-labelledby="skill-pathway-title">
      <h2 id="skill-pathway-title" className="text-lg font-semibold">Your learning pathway</h2>
      <p className="mb-4 mt-2 text-sm leading-relaxed text-secondary">Question counts describe available content, not completed work.</p>
      <DemoPathway />
    </section>
    <p className="text-sm leading-relaxed text-secondary">This preview assumes familiarity with basic differentiation.</p>
    <section aria-labelledby="explore-chain-rule"><h2 id="explore-chain-rule" className="text-lg font-semibold">Explore Chain Rule</h2>
      <p className="mt-2 text-sm text-secondary">Browse the full skill. The short walkthrough samples one question per stage, not a shortened completion pathway.</p>
      <div className="mt-4 divide-y divide-rule">{context.skillPath.learningStages?.map((stage) => <details key={stage.id} className="disclosure-motion py-2">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">{stage.name === "Past Paper-style Questions" ? "Exam practice" : stage.name} · {stage.questionIds.length} questions</summary>
        <ol className="grid gap-1 pb-3">{getDemoQuestions().filter((question) => question.stageId === stage.id).map((question, index) => <li key={question.id}>
          <Link href={runtime.navigation.question(question.id)!} className="orthic-secondary-link inline-flex min-h-11 items-center gap-3 text-sm leading-relaxed"><span className="text-secondary">{index + 1}.</span>{question.title}</Link>
        </li>)}</ol>
      </details>)}</div>
    </section>
  </div>;
}
