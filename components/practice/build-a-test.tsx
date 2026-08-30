"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { Button, Card, PageHeaderIconChip } from "@/components/ui";
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
      <div className="mx-auto grid min-w-0 max-w-[920px] grid-cols-[minmax(0,1fr)] gap-5" data-testid="build-a-test-page">
        <nav aria-label="Build a Test navigation" className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
          <Link href="/practice" className="inline-flex min-h-10 items-center gap-2 text-forge"><ArrowLeft aria-hidden="true" className="size-4" />Back to Practice</Link>
          <Link href="/subjects/higher-maths/question-bank" className="inline-flex min-h-10 items-center text-muted hover:text-forge">Choose questions manually</Link>
        </nav>

        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div className="flex min-w-0 items-start gap-3">
            <PageHeaderIconChip><ClipboardCheck aria-hidden="true" className="size-5" /></PageHeaderIconChip>
            <div>
              <p className="text-sm font-bold text-muted">Higher Maths</p>
              <h1 className="mt-1 text-[28px] font-extrabold leading-tight">Build a Test</h1>
              <p className="mt-2 max-w-2xl text-muted">Choose what your assessment covers and Orthic will build a valid test from the questions available now.</p>
            </div>
          </div>
          <AppTopbar demo={false} />
        </header>

        <Card className="p-5" data-testid="test-scope-selector">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">1. Choose assessment content</h2>
              <p className="mt-1 text-sm text-muted">Select the official specification wording your teacher gave you.</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-muted" data-testid="selected-requirement-count">{selectedRequirementIds.length} selected</span>
              <button type="button" onClick={() => setSelectedRequirementIds([])} disabled={selectedRequirementIds.length === 0} className="min-h-10 font-extrabold text-forge disabled:opacity-40">Clear all</button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {requirementAreas.map((area) => {
              const areaIds = area.strands.flatMap((strand) => strand.requirements.map((requirement) => requirement.specPointId));
              const selectedInArea = areaIds.filter((id) => selectedRequirementIds.includes(id));
              return (
                <details key={area.courseAreaId} open={selectedInArea.length > 0} className="group rounded-xl border border-line bg-white">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-extrabold [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-2"><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" /><span>{area.courseAreaName}</span></span>
                    <span className="shrink-0 text-xs font-bold text-muted">{selectedInArea.length ? `${selectedInArea.length} selected` : `${areaIds.length} requirements`}</span>
                  </summary>
                  <div className="grid gap-3 border-t border-line p-3 sm:p-4">
                    {area.strands.map((strand) => {
                      const strandIds = strand.requirements.map((requirement) => requirement.specPointId);
                      const selectedInStrand = strandIds.filter((id) => selectedRequirementIds.includes(id));
                      const allSelected = strandIds.length > 0 && selectedInStrand.length === strandIds.length;
                      return (
                        <fieldset key={strand.strandId} className="min-w-0 rounded-lg bg-paper p-3">
                          <legend className="sr-only">{strand.strandName}</legend>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-extrabold">{strand.strandName}</h3>
                            <button type="button" onClick={() => toggleGroup(strandIds)} className="min-h-10 px-1 text-xs font-extrabold text-forge">{allSelected ? "Clear group" : "Select group"}</button>
                          </div>
                          <div className="mt-1 grid gap-1">
                            {strand.requirements.map((requirement) => {
                              const checked = selectedRequirementIds.includes(requirement.specPointId);
                              const availableCount = requirementQuestionCounts.get(requirement.specPointId) ?? 0;
                              return (
                                <label key={requirement.specPointId} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-white">
                                  <input type="checkbox" checked={checked} onChange={() => toggleRequirement(requirement.specPointId)} className="mt-0.5 size-4 shrink-0" />
                                  <span className="min-w-0">
                                    <span className="block break-words leading-snug">{requirement.wording}</span>
                                    <span className="mt-0.5 block text-xs text-muted">{availableCount > 0 ? `${availableCount} matching question${availableCount === 1 ? "" : "s"}` : "No questions available yet"}</span>
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
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-extrabold">2. Choose test size</h2>
          <fieldset className="mt-3">
            <legend className="sr-only">Test size</legend>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1" data-testid="test-size-options">
              {BUILD_A_TEST_SIZE_OPTIONS.map((option) => (
                <button key={option.id} type="button" aria-pressed={size === option.id} onClick={() => setSize(option.id)} className={`min-h-14 rounded-lg border px-3 py-2 text-left ${size === option.id ? "border-forge bg-forge-soft" : "border-line bg-white"}`}>
                  <strong className="block">{option.label}</strong>
                  <span className="text-sm text-muted">{option.questionCount} questions</span>
                </button>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card className="grid grid-cols-[1fr_auto] items-center gap-5 border-forge/30 p-5 max-md:grid-cols-1" data-testid="test-build-summary">
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
          <Button onClick={startTest} disabled={plan.status !== "ready" || activation.busy} className="min-w-36 max-md:w-full">Build test <ArrowRight aria-hidden="true" className="size-5" /></Button>
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
