"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { MathGraph } from "@/components/maths/math-graph";
import { MathContent } from "@/components/questions/math-content";
import { WorkedSolutionContent } from "@/components/questions/worked-solution-content";
import {
  getLessonBlockHighlightEligibility,
  getLessonBlockPlainText,
  getMalformedBlockDisposition,
} from "@/lib/lessons/lesson-document";
import type { CalloutSemantic, LessonBlock, LessonCalloutBlock, LessonDocument } from "@/lib/lessons/types";

export type LessonTypography = "system_sans" | "restrained_serif";

export function LessonRenderer({ document, typography = "system_sans" }: { document: LessonDocument; typography?: LessonTypography }) {
  const [selfCheckEngaged, setSelfCheckEngaged] = useState(false);
  const hasContents = (document.sections?.length ?? 0) > 1;
  const environment = process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV === "test" ? "test" : "development";

  useEffect(() => {
    function scrollToLessonFragment() {
      const fragment = window.location.hash.slice(1);
      if (!fragment) return;
      const blockId = decodeURIComponent(fragment);
      const target = window.document.getElementById(blockId);
      if (!target || target.dataset.lessonId !== document.lessonId) return;
      target.scrollIntoView({ block: "start", behavior: "instant" });
    }
    scrollToLessonFragment();
    const afterLayout = window.setTimeout(scrollToLessonFragment, 150);
    window.addEventListener("hashchange", scrollToLessonFragment);
    return () => {
      window.clearTimeout(afterLayout);
      window.removeEventListener("hashchange", scrollToLessonFragment);
    };
  }, [document.lessonId]);

  return (
    <article className="lesson-article min-w-0" data-testid="lesson-document" data-lesson-id={document.lessonId} data-content-revision={document.contentRevision}>
      <header className="border-b border-line pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-forge">
          <span>{document.qualification.label}</span><span aria-hidden="true">·</span><span>{document.estimatedReadingMinutes} min read</span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{document.title}</h1>
        <p className="mt-3 max-w-[70ch] text-base leading-relaxed text-muted">{document.objective}</p>
      </header>

      {hasContents ? (
        <details className="mt-4 rounded-xl border border-line bg-white lg:hidden" data-lesson-contents>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-extrabold">
            On this page <ChevronDown aria-hidden="true" className="size-4" />
          </summary>
          <SectionLinks document={document} className="border-t border-line p-3" />
        </details>
      ) : null}

      <div className={`mt-6 grid min-w-0 gap-8 ${hasContents ? "lg:grid-cols-[190px_minmax(0,1fr)]" : ""}`}>
        {hasContents ? (
          <aside className="hidden lg:block" aria-label="Lesson contents">
            <div className="sticky top-6">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">On this page</p>
              <SectionLinks document={document} />
            </div>
          </aside>
        ) : null}

        <div className={`min-w-0 ${typography === "restrained_serif" ? "lesson-reading-serif" : "lesson-reading-sans"}`} data-typography={typography}>
          <div className="grid gap-6" data-testid="lesson-blocks">
            {document.blocks.map((candidate, index) => {
              const disposition = getMalformedBlockDisposition(candidate, environment);
              if (disposition.action === "omit") return null;
              if (disposition.action === "diagnostic") {
                return (
                  <div key={`diagnostic-${index}`} role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm" data-testid="lesson-block-diagnostic">
                    <p className="font-extrabold">Lesson block could not be rendered.</p>
                    <ul className="mt-2 list-disc pl-5">{disposition.issues.map((issue) => <li key={`${issue.path}:${issue.code}`}>{issue.path}: {issue.message}</li>)}</ul>
                  </div>
                );
              }
              if (disposition.action === "calm_fallback") {
                return <p key={`fallback-${index}`} className="rounded-xl border border-line bg-paper p-4 text-sm font-bold text-muted">Part of this lesson is temporarily unavailable.</p>;
              }
              return <LessonBlockView key={candidate.blockId} block={candidate} document={document} onSelfCheckEngaged={() => setSelfCheckEngaged(true)} />;
            })}
          </div>

          <footer className="mt-8 border-t border-forge/25 pt-6" data-testid="lesson-closure">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forge-soft text-forge"><CheckCircle2 aria-hidden="true" className="size-5" /></span>
              <div>
                <h2 className="text-xl font-extrabold">Recap</h2>
                <p className="mt-2 max-w-[70ch] leading-relaxed text-muted">{document.closure.recap}</p>
                {document.closure.confidencePrompt ? <p className="mt-3 text-sm font-bold text-ink">{document.closure.confidencePrompt}</p> : null}
              </div>
            </div>
            <Link href={document.closure.foundationsHref} className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white transition max-sm:w-full ${selfCheckEngaged ? "shadow-card" : ""}`}>
              Continue to Foundations <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </footer>
        </div>
      </div>
    </article>
  );
}

function SectionLinks({ document, className = "" }: { document: LessonDocument; className?: string }) {
  return (
    <nav aria-label="Lesson sections" className={`grid gap-1 ${className}`}>
      {document.sections?.map((section) => (
        <a key={section.sectionId} href={`#${section.anchorBlockId}`} className="rounded-lg px-3 py-2 text-sm font-bold text-muted hover:bg-forge-soft hover:text-forge">
          {section.title}
        </a>
      ))}
    </nav>
  );
}

function LessonBlockView({ block, document, onSelfCheckEngaged }: { block: LessonBlock; document: LessonDocument; onSelfCheckEngaged: () => void }) {
  const eligibility = getLessonBlockHighlightEligibility(block);
  const annotationProps = {
    id: block.blockId,
    "data-lesson-id": document.lessonId,
    "data-content-revision": document.contentRevision,
    "data-block-id": block.blockId,
    "data-highlight-eligible": eligibility,
    "data-annotation-plain-text": eligibility === "none" ? undefined : getLessonBlockPlainText(block),
  };

  if (block.type === "heading") {
    const className = "scroll-mt-24 border-t border-line pt-6 text-2xl font-extrabold first:border-t-0 first:pt-0";
    return block.level === 2
      ? <h2 {...annotationProps} className={className}>{block.text}</h2>
      : <h3 {...annotationProps} className={className}>{block.text}</h3>;
  }
  if (block.type === "prose") {
    return <section {...annotationProps} className="scroll-mt-24 max-w-[70ch] text-[1.02rem] leading-8 text-ink"><MathContent>{block.content}</MathContent></section>;
  }
  if (block.type === "callout") return <Callout block={block} annotationProps={annotationProps} />;
  if (block.type === "worked_example") {
    return (
      <section {...annotationProps} className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 sm:p-6" data-testid="lesson-worked-example">
        <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Worked example</p>
        <h3 className="mt-1 text-xl font-extrabold">{block.title}</h3>
        <div className="mt-4 rounded-xl border border-line bg-paper p-4"><MathContent>{block.prompt}</MathContent></div>
        <div className="mt-5"><WorkedSolutionContent solution={block.steps} finalAnswer={block.finalAnswer} /></div>
        {block.explanation ? <div className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted"><MathContent>{block.explanation}</MathContent></div> : null}
        {block.commonMistake ? <p className="mt-3 border-l-2 border-warning pl-3 text-sm font-bold text-muted">{block.commonMistake}</p> : null}
      </section>
    );
  }
  if (block.type === "figure") {
    return (
      <section {...annotationProps} className="scroll-mt-24" data-testid="lesson-figure">
        <MathGraph title={block.title} description={block.description} viewport={block.figure.viewport} functions={block.figure.functions} points={block.figure.points} selectedX={block.figure.selectedX} tangent={block.figure.tangent} />
      </section>
    );
  }
  return (
    <details {...annotationProps} className="group scroll-mt-24 rounded-2xl border border-forge/25 bg-white" onToggle={(event) => { if (event.currentTarget.open) onSelfCheckEngaged(); }} data-testid="lesson-self-check" data-lesson-collapsible>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span><span className="block text-xs font-extrabold uppercase tracking-wide text-forge">Self-check</span><span className="mt-1 block text-lg font-extrabold">{block.title}</span></span>
        <ChevronDown aria-hidden="true" className="size-5 transition group-open:rotate-180" />
      </summary>
      <div className="lesson-collapsible-content border-t border-line px-5 py-4" data-collapsible-content>
        <div className="font-bold"><MathContent>{block.prompt}</MathContent></div>
        <div className="mt-4 rounded-xl bg-forge-soft p-4"><p className="mb-2 text-sm font-extrabold text-forge">Answer</p><MathContent>{block.answer}</MathContent></div>
        {block.explanation ? <div className="mt-3 text-sm text-muted"><MathContent>{block.explanation}</MathContent></div> : null}
      </div>
    </details>
  );
}

function Callout({ block, annotationProps }: { block: LessonCalloutBlock; annotationProps: Record<string, string | number | undefined> }) {
  const family = calloutFamily(block.semantic);
  const Icon = family === "core" ? BookOpen : family === "caution" ? ShieldAlert : family === "strategy" ? Lightbulb : Sparkles;
  const style = family === "caution"
    ? "border-warning/60 text-warning"
    : family === "strategy"
      ? "border-forge/50 text-forge"
      : family === "depth"
        ? "border-[#76629b]/50 text-[#5d477e]"
        : "border-success/50 text-success";
  const content = (
    <div className="lesson-collapsible-content border-t border-current/15 px-5 py-4 text-ink" data-collapsible-content>
      <div className="max-w-[70ch] leading-relaxed"><MathContent>{block.content}</MathContent></div>
      {block.formula ? <div className="mt-3 overflow-x-auto border-l-2 border-current/25 pl-4" data-formula-save-mode="whole-block"><MathContent>{block.formula}</MathContent></div> : null}
    </div>
  );
  if (block.defaultCollapsed !== undefined || family === "depth") {
    return (
      <details {...annotationProps} open={!block.defaultCollapsed} className={`group scroll-mt-24 rounded-xl border-l-4 bg-white ${style}`} data-callout-family={family} data-lesson-collapsible>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
          <span className="inline-flex items-center gap-2 font-extrabold"><Icon aria-hidden="true" className="size-4" />{block.title}</span>
          <ChevronDown aria-hidden="true" className="size-4 transition group-open:rotate-180" />
        </summary>
        {content}
      </details>
    );
  }
  return (
    <aside {...annotationProps} className={`scroll-mt-24 rounded-xl border-l-4 bg-white px-5 py-4 ${style}`} data-callout-family={family}>
      <h3 className="flex items-center gap-2 font-extrabold"><Icon aria-hidden="true" className="size-4" />{block.title}</h3>
      <div className="mt-2 text-ink"><div className="max-w-[70ch] leading-relaxed"><MathContent>{block.content}</MathContent></div>{block.formula ? <div className="mt-3 overflow-x-auto border-l-2 border-current/25 pl-4" data-formula-save-mode="whole-block"><MathContent>{block.formula}</MathContent></div> : null}</div>
    </aside>
  );
}

function calloutFamily(semantic: CalloutSemantic): "core" | "caution" | "strategy" | "depth" {
  if (["definition", "formula", "key_idea"].includes(semantic)) return "core";
  if (["common_mistake", "warning"].includes(semantic)) return "caution";
  if (["exam_tip", "memory_trick"].includes(semantic)) return "strategy";
  return "depth";
}
