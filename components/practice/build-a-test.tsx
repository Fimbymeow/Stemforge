"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { Button, Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import {
  BUILD_A_TEST_SIZE_OPTIONS,
  createBuildATestPlan,
  createBuildATestSession,
  type BuildATestSize,
} from "@/lib/practice/test-builder";
import { studyPlanRequirementScopeOptions } from "@/lib/study-plan/scope-options";

export function BuildATest() {
  const activation = usePracticeActivation();
  const requirementAreas = useMemo(() => studyPlanRequirementScopeOptions("higher-maths"), []);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);
  const [size, setSize] = useState<BuildATestSize>("short");
  const requestedCount = BUILD_A_TEST_SIZE_OPTIONS.find((option) => option.id === size)!.questionCount;
  const seed = `build-a-test:${[...selectedRequirementIds].sort().join(",")}:${requestedCount}`;
  const plan = useMemo(() => createBuildATestPlan({ selectedRequirementIds, requestedCount, seed }), [requestedCount, seed, selectedRequirementIds]);
  const requirementQuestionCounts = useMemo(() => new Map(requirementAreas
    .flatMap((area) => area.strands)
    .flatMap((strand) => strand.requirements)
    .map((requirement) => [requirement.specPointId, createBuildATestPlan({ selectedRequirementIds: [requirement.specPointId], requestedCount: 1, seed: `requirement:${requirement.specPointId}` }).availableCount])), [requirementAreas]);
  const skillNames = useMemo(() => new Map(contentResolver.getAllPathContexts().map((context) => [context.skillPath.slug, context.skillPath.name])), []);
  const resolvedSkillNames = resolveSkillsForRequirements(selectedRequirementIds).map((id) => skillNames.get(id) ?? id);

  function toggleRequirement(specPointId: string) {
    setSelectedRequirementIds((current) => current.includes(specPointId)
      ? current.filter((id) => id !== specPointId)
      : [...current, specPointId]);
  }

  function toggleGroup(groupIds: string[]) {
    setSelectedRequirementIds((current) => {
      const allSelected = groupIds.every((id) => current.includes(id));
      return allSelected ? current.filter((id) => !groupIds.includes(id)) : [...new Set([...current, ...groupIds])];
    });
  }

  function startTest() {
    const result = createBuildATestSession({ selectedRequirementIds, requestedCount, seed });
    if (result.session) void activation.begin(result.session);
  }

  return (
    <AppShell demo active="Practice" className="py-8 max-lg:pt-5">
      <div className="mx-auto grid min-w-0 max-w-[1040px] grid-cols-[minmax(0,1fr)] gap-7" data-testid="build-a-test-page">
        <nav aria-label="Build a Test navigation" className="flex min-h-11 flex-wrap items-center justify-between gap-x-5 gap-y-1 text-sm">
          <Link href="/practice" className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 rounded text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"><ArrowLeft aria-hidden="true" className="size-4" />Back to Practice</Link>
          <Link href="/subjects/higher-maths/question-bank" className="orthic-secondary-link inline-flex min-h-11 items-center rounded text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">Choose questions manually</Link>
        </nav>

        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div className="flex min-w-0 items-start gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Higher Maths</p>
              <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">Build a Test</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-secondary">Choose what your assessment covers and Orthic will build a valid test from the questions available now.</p>
            </div>
          </div>
        </header>

        <Card className="overflow-hidden !rounded-lg !border-rule !shadow-none" data-testid="test-scope-selector">
          <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-7">
            <div>
              <h2 className="text-xl font-extrabold">1. Choose assessment content</h2>
              <p className="mt-1 text-sm text-muted">Select the official specification wording your teacher gave you.</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-muted" data-testid="selected-requirement-count">{selectedRequirementIds.length} selected</span>
              <button type="button" onClick={() => setSelectedRequirementIds([])} disabled={selectedRequirementIds.length === 0} className="orthic-secondary-link min-h-11 rounded text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy disabled:opacity-40">Clear all</button>
            </div>
          </div>

          <div className="divide-y divide-rule border-y border-rule">
            {requirementAreas.map((area) => {
              const areaIds = area.strands.flatMap((strand) => strand.requirements.map((requirement) => requirement.specPointId));
              const selectedInArea = areaIds.filter((id) => selectedRequirementIds.includes(id));
              const availableInArea = areaIds.filter((id) => (requirementQuestionCounts.get(id) ?? 0) > 0).length;
              return (
                <details key={area.courseAreaId} open={selectedInArea.length > 0} className="group disclosure-motion bg-white" data-testid={`requirement-area-${area.courseAreaId}`}>
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-extrabold max-[340px]:flex-col max-[340px]:items-stretch max-[340px]:gap-1 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-2"><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" /><span>{area.courseAreaName}</span></span>
                    <span className="shrink-0 text-right text-xs font-bold leading-snug text-muted max-[340px]:pl-6 max-[340px]:text-left" data-testid={`area-availability-${area.courseAreaId}`}>
                      <span className="block">{availableInArea} of {areaIds.length} available</span>
                      {selectedInArea.length ? <span className="block font-normal">{selectedInArea.length} selected</span> : null}
                    </span>
                  </summary>
                  <div className="grid gap-6 border-t border-rule px-3 py-5 sm:px-7">
                    {area.strands.map((strand) => {
                      const strandIds = strand.requirements.map((requirement) => requirement.specPointId);
                      const selectedInStrand = strandIds.filter((id) => selectedRequirementIds.includes(id));
                      const allSelected = strandIds.length > 0 && selectedInStrand.length === strandIds.length;
                      const availableInStrand = strandIds.filter((id) => (requirementQuestionCounts.get(id) ?? 0) > 0).length;
                      return (
                        <fieldset key={strand.strandId} className="min-w-0">
                          <legend className="sr-only">{strand.strandName}</legend>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-1">
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold">{strand.strandName}</h3>
                              <p className="mt-0.5 text-xs text-muted" data-testid={`strand-availability-${strand.strandId}`}>{availableInStrand} of {strandIds.length} available</p>
                            </div>
                            <button type="button" onClick={() => toggleGroup(strandIds)} className="orthic-secondary-link min-h-11 rounded px-1 text-xs text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">{allSelected ? "Clear group" : "Select group"}</button>
                          </div>
                          <div className="mt-1 grid gap-1">
                            {strand.requirements.map((requirement) => {
                              const checked = selectedRequirementIds.includes(requirement.specPointId);
                              const availableCount = requirementQuestionCounts.get(requirement.specPointId) ?? 0;
                              const hasAvailableQuestions = availableCount > 0;
                              return (
                                <label
                                  key={requirement.specPointId}
                                  data-availability={hasAvailableQuestions ? "available" : "unavailable"}
                                  className={`orthic-plan-row flex min-h-11 cursor-pointer items-start gap-3 rounded px-2 py-3 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-navy ${checked ? "bg-forge-soft" : ""} ${hasAvailableQuestions ? "text-navy" : "text-secondary"}`}
                                >
                                  <input type="checkbox" checked={checked} onChange={() => toggleRequirement(requirement.specPointId)} className="mt-0.5 size-4 shrink-0" />
                                  <span className="min-w-0">
                                    <span className={`block break-words leading-snug ${hasAvailableQuestions ? "font-medium" : "font-normal"}`}>{requirement.wording}</span>
                                    <span className="mt-0.5 block text-xs text-muted">{hasAvailableQuestions ? `${availableCount} matching question${availableCount === 1 ? "" : "s"}` : "No questions available yet"}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        <section className="p-5 sm:p-7">
          <h2 className="text-xl font-extrabold">2. Choose test size</h2>
          <fieldset className="mt-3">
            <legend className="sr-only">Test size</legend>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1" data-testid="test-size-options">
              {BUILD_A_TEST_SIZE_OPTIONS.map((option) => (
                <button key={option.id} type="button" aria-pressed={size === option.id} onClick={() => setSize(option.id)} className={`orthic-course-action min-h-14 rounded border px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${size === option.id ? "border-navy bg-forge-soft" : "border-rule bg-white"}`}>
                  <strong className="block">{option.label}</strong>
                  <span className="text-sm text-muted">{option.questionCount} questions</span>
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-t border-rule p-5 sm:p-7 max-md:grid-cols-1" data-testid="test-build-summary">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold">3. Build your test</h2>
            <p className="mt-1 font-bold" aria-live="polite" data-testid="test-availability-status">{availabilityCopy(plan.status, plan.availableCount, plan.requestedCount)}</p>
            {selectedRequirementIds.length > 0 ? (
              <p className="mt-2 break-words text-sm text-muted" data-testid="test-scope-summary">
                {selectedRequirementIds.length} specification requirement{selectedRequirementIds.length === 1 ? "" : "s"} selected
                {resolvedSkillNames.length ? ` · assessed content: ${resolvedSkillNames.join(", ")}` : ""}.
              </p>
            ) : null}
            {plan.unavailableRequirementIds.length > 0 && plan.availableCount > 0 ? (
              <p className="mt-2 text-sm text-muted">{plan.unavailableRequirementIds.length} selected requirement{plan.unavailableRequirementIds.length === 1 ? " does" : "s do"} not yet have live questions; the test covers only the available selected content.</p>
            ) : null}
            <p className="mt-2 text-xs text-muted">Formal prerequisites may support question solving, but they do not become assessed skills or receive evidence.</p>
          </div>
          <Button onClick={startTest} disabled={plan.status !== "ready" || activation.busy} className="orthic-primary-action min-w-36 !rounded !bg-navy max-md:w-full">Build test <ArrowRight aria-hidden="true" className="orthic-arrow size-5" /></Button>
        </section>
        </Card>

        {activation.error ? <p role="alert" className="text-sm font-bold text-danger">{activation.error}</p> : null}
      </div>
      {activation.activationUi}
    </AppShell>
  );
}

function availabilityCopy(status: ReturnType<typeof createBuildATestPlan>["status"], availableCount: number, requestedCount: number) {
  if (status === "empty_selection") return "Choose at least one specification requirement to see what is available.";
  if (status === "no_content") return "Orthic does not yet have questions for this selected scope.";
  if (status === "insufficient_content") return `Only ${availableCount} question${availableCount === 1 ? "" : "s"} currently match this scope. Choose a smaller test or alter the selection.`;
  return `${availableCount} questions available for this scope · ${requestedCount} will be selected.`;
}
