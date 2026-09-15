"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { MathGraph } from "@/components/maths/math-graph";
import { MathContent } from "@/components/questions/math-content";
import { Eyebrow } from "@/components/ui";
import {
  getLessonBlockHighlightEligibility,
  getLessonBlockPlainText,
  getMalformedBlockDisposition,
} from "@/lib/lessons/lesson-document";
import type { CalloutSemantic, LessonBlock, LessonCalloutBlock, LessonDocument, LessonSelfCheckBlock } from "@/lib/lessons/types";

export type LessonTypography = "system_sans" | "restrained_serif";

export function LessonRenderer({ document, typography = "system_sans", continuation }: { document: LessonDocument; typography?: LessonTypography; continuation?: { href: string; label: string } }) {
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
      <header className="max-w-[70ch] border-b border-rule pb-7">
        <p className="font-mono text-[11px] uppercase tracking-widest text-secondary">{document.qualification.label} / Notes</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-tight tracking-tight text-navy">{document.title}</h1>
        <p className="mt-4 text-base leading-7 text-secondary">{document.objective}</p>
      </header>

      {hasContents ? (
        <details className="mt-5 disclosure-motion rounded-sm border border-rule bg-white lg:hidden motion-reduce:[&::details-content]:!duration-0" data-lesson-contents>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-medium text-navy">
            On this page <ChevronDown aria-hidden="true" className="size-4" />
          </summary>
          <SectionLinks document={document} className="border-t border-line p-3" />
        </details>
      ) : null}

      <div className={`mt-8 grid min-w-0 gap-8 ${hasContents ? "lg:grid-cols-[170px_minmax(0,1fr)]" : ""}`}>
        {hasContents ? (
          <aside className="hidden lg:block" aria-label="Lesson contents">
            <div className="sticky top-6">
              <Eyebrow className="mb-2 text-secondary">On this page</Eyebrow>
              <SectionLinks document={document} />
            </div>
          </aside>
        ) : null}

        <div className={`min-w-0 ${typography === "restrained_serif" ? "lesson-reading-serif" : "lesson-reading-sans"}`} data-typography={typography}>
          <div className="grid gap-7" data-testid="lesson-blocks">
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
              return <LessonBlockView key={candidate.blockId} block={candidate} document={document} />;
            })}
          </div>

          <footer className="mt-10 max-w-[70ch] border-t border-rule pt-7" data-testid="lesson-closure">
            <Link href={continuation?.href ?? document.closure.foundationsHref} className="orthic-primary-action inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-navy px-5 text-sm font-semibold text-white max-sm:w-full">
              {continuation?.label ?? "Continue to Foundations"} <ArrowRight aria-hidden="true" className="orthic-arrow size-4" />
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
        <a key={section.sectionId} href={`#${section.anchorBlockId}`} className="orthic-secondary-link inline-flex min-h-11 items-center rounded-sm px-3 py-2 text-sm text-secondary hover:bg-white hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
          {section.title}
        </a>
      ))}
    </nav>
  );
}

function LessonBlockView({ block, document }: { block: LessonBlock; document: LessonDocument }) {
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
    const className = "scroll-mt-24 pt-4 text-2xl font-semibold leading-tight text-navy first:pt-0";
    return block.level === 2
      ? <h2 {...annotationProps} className={className}>{block.text}</h2>
      : <h3 {...annotationProps} className={className}>{block.text}</h3>;
  }
  if (block.type === "prose") {
    return <section {...annotationProps} className="lesson-prose scroll-mt-24 max-w-[70ch] text-[1.02rem] leading-8 text-navy"><MathContent>{block.content}</MathContent></section>;
  }
  if (block.type === "callout") return <Callout block={block} annotationProps={annotationProps} />;
  if (block.type === "worked_example") {
    return (
      <section {...annotationProps} className="scroll-mt-24 max-w-[70ch] rounded-sm border border-rule bg-paper px-5 py-6 sm:px-6" data-testid="lesson-worked-example">
        <Eyebrow className="text-secondary">Worked example</Eyebrow>
        <h3 className="mt-1 text-xl font-semibold text-navy">{block.title}</h3>
        <div className="mt-4 font-medium"><MathContent>{block.prompt}</MathContent></div>
        <ol className="mt-5 grid gap-5" aria-label="Worked solution steps" data-testid="static-worked-solution">
          {block.steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="border-t border-rule pt-4 first:border-0 first:pt-0">
              <p className="font-mono text-xs uppercase tracking-wide text-secondary">Step {index + 1}</p>
              <h4 className="mt-1 font-semibold text-navy">{step.title}</h4>
              <div className="mt-2 leading-7"><MathContent>{step.body}</MathContent></div>
            </li>
          ))}
        </ol>
        <div className="mt-5 border-t border-navy/40 pt-4">
          <p className="mb-2 text-sm font-semibold text-navy">Final answer</p>
          <MathContent>{block.finalAnswer}</MathContent>
        </div>
        {block.explanation ? <div className="lesson-prose mt-4 max-w-[70ch] text-sm leading-relaxed text-secondary"><MathContent>{block.explanation}</MathContent></div> : null}
        {block.commonMistake ? <div className="mt-4 border-l-2 border-warning bg-warning/5 px-3 py-2 text-sm text-secondary" data-testid="lesson-common-mistake"><p className="mb-1 font-semibold text-warning">Common mistake</p><MathContent>{block.commonMistake}</MathContent></div> : null}
      </section>
    );
  }
  if (block.type === "figure") {
    return (
      <section {...annotationProps} className="min-w-0 scroll-mt-24 py-3" data-testid="lesson-figure">
        <MathGraph title={block.title} description={block.description} viewport={block.figure.viewport} functions={block.figure.functions} points={block.figure.points} selectedX={block.figure.selectedX} tangent={block.figure.tangent} />
      </section>
    );
  }
  return <SelfCheckBlock block={block} annotationProps={annotationProps} />;
}

function SelfCheckBlock({ block, annotationProps }: { block: LessonSelfCheckBlock; annotationProps: Record<string, string | number | undefined> }) {
  const [revealed, setRevealed] = useState(false);
  const answerId = `${block.blockId}-answer`;
  return (
    <details {...annotationProps} className="group disclosure-motion scroll-mt-24 rounded-sm border border-rule bg-white motion-reduce:[&::details-content]:!duration-0" data-testid="lesson-self-check" data-lesson-collapsible>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
        <span><Eyebrow as="span" className="block text-secondary">Self-check</Eyebrow><span className="mt-1 block text-lg font-semibold text-navy">{block.title}</span></span>
        <ChevronDown aria-hidden="true" className="size-5 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="lesson-collapsible-content border-t border-line px-5 py-4" data-collapsible-content>
        <div className="font-medium"><MathContent>{block.prompt}</MathContent></div>
        <button type="button" aria-controls={answerId} aria-expanded={revealed} onClick={() => setRevealed((value) => !value)} className="orthic-secondary-link mt-4 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          {revealed ? "Hide answer" : "Reveal answer"}
        </button>
        <div id={answerId} data-answer-revealed={revealed} className={`mt-3 rounded-sm border-l-2 border-navy bg-paper p-4 transition-[opacity,filter] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${revealed ? "opacity-100 blur-0" : "opacity-60 blur-sm"}`} data-testid="lesson-self-check-answer">
          {revealed ? (
            <>
              <p className="mb-2 text-sm font-semibold text-navy">Answer</p>
              <MathContent>{block.answer}</MathContent>
              {block.explanation ? <div className="mt-3 text-sm text-secondary"><MathContent>{block.explanation}</MathContent></div> : null}
            </>
          ) : (
            <div aria-hidden="true" className="grid gap-2 py-1">
              <div className="h-2 w-4/5 rounded-sm bg-rule" />
              <div className="h-2 w-2/3 rounded-sm bg-rule" />
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function Callout({ block, annotationProps }: { block: LessonCalloutBlock; annotationProps: Record<string, string | number | undefined> }) {
  const family = calloutFamily(block.semantic);
  const style = family === "caution"
    ? "border-warning bg-warning/10 text-warning"
    : family === "strategy"
      ? "border-rule bg-white text-navy"
      : family === "depth"
        ? "border-rule bg-white text-navy"
        : "border-navy bg-transparent text-navy";
  const content = (
    <div className="lesson-collapsible-content border-t border-rule px-5 py-4 text-navy" data-collapsible-content>
      <div className="lesson-prose max-w-[70ch] leading-7"><MathContent>{block.content}</MathContent></div>
      {block.formula ? <div className="mt-4 min-w-0 overflow-x-auto py-2" data-formula-save-mode="whole-block"><MathContent>{block.formula}</MathContent></div> : null}
    </div>
  );
  if (block.defaultCollapsed !== undefined || family === "depth") {
    return (
      <details {...annotationProps} open={!block.defaultCollapsed} className={`group disclosure-motion scroll-mt-24 border-l-2 ${style} motion-reduce:[&::details-content]:!duration-0`} data-callout-family={family} data-lesson-collapsible>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
          <span className="font-semibold">{block.title}</span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        {content}
      </details>
    );
  }
  return (
    <aside {...annotationProps} className={`scroll-mt-24 border-l-2 px-5 ${family === "caution" ? "py-3" : "py-4"} ${style}`} data-callout-family={family}>
      <h3 className="font-semibold">{block.title}</h3>
      <div className="mt-2 text-navy"><div className="lesson-prose max-w-[70ch] leading-7"><MathContent>{block.content}</MathContent></div>{block.formula ? <div className="mt-4 min-w-0 overflow-x-auto py-2" data-formula-save-mode="whole-block"><MathContent>{block.formula}</MathContent></div> : null}</div>
    </aside>
  );
}

function calloutFamily(semantic: CalloutSemantic): "core" | "caution" | "strategy" | "depth" {
  if (["definition", "formula", "key_idea"].includes(semantic)) return "core";
  if (["common_mistake", "warning"].includes(semantic)) return "caution";
  if (["exam_tip", "memory_trick"].includes(semantic)) return "strategy";
  return "depth";
}
