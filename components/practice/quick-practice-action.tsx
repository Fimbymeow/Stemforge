"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { readConfidenceLocalState } from "@/lib/confidence/local-state";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import type { QuickPracticeDurationMinutes } from "@/lib/practice/adaptive-practice";
import { readStudyPlanLocalState } from "@/lib/study-plan/local-state";
import { createQuickPracticeSelection, type QuickPracticeSelection } from "@/lib/study-context";
import { useHasMounted } from "@/lib/use-mounted";
import { usePremiumPreview } from "@/components/premium-preview-provider";
import { premiumAssessmentContext } from "@/lib/premium-preview";

export function QuickPracticeAction({
  preferredPathId,
  className = "",
  label = "Start Quick Practice",
  testId = "quick-practice-action",
  describedBy,
  durationMinutes = 20,
  preview,
}: {
  preferredPathId?: string | null;
  className?: string;
  label?: string;
  testId?: string;
  describedBy?: string;
  durationMinutes?: QuickPracticeDurationMinutes;
  preview?: QuickPracticeSelection;
}) {
  const activation = usePracticeActivation();
  const premiumPreview = usePremiumPreview();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const nextAction = deriveLearnerNextAction({ evidence });
  const quick = useMemo(() => preview ?? createSelection(evidence, preferredPathId ?? nextAction.pathId, durationMinutes, hasMounted, premiumPreview.enabled),
    [durationMinutes, evidence, hasMounted, nextAction.pathId, preferredPathId, premiumPreview.enabled, preview]);
  function begin() {
    const selection = createSelection(getProgressEvidence(), preferredPathId ?? nextAction.pathId, durationMinutes, true, premiumPreview.enabled);
    if (!selection.result.session) return;
    void activation.begin(selection.result.session);
  }

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        aria-describedby={describedBy}
        onClick={begin}
        disabled={!hasMounted || !quick.result.session || activation.busy}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:duration-100 disabled:opacity-45 disabled:hover:translate-y-0 ${className}`}
      >
        {label}
        <ArrowRight className="size-5" />
      </button>
      {activation.error ? <p role="status" className="text-sm text-red-700">{activation.error}</p> : null}
      {activation.activationUi}
    </>
  );
}

function createSelection(
  evidence: ReturnType<typeof getProgressEvidence>,
  preferredPathId: string | null,
  durationMinutes: QuickPracticeDurationMinutes,
  canReadBrowserState: boolean,
  assessmentAware: boolean,
) {
  if (!canReadBrowserState || typeof window === "undefined") {
    return createQuickPracticeSelection({ evidence, preferredPathId, durationMinutes });
  }
  const studyPlan = readStudyPlanLocalState(window.localStorage);
  const confidence = readConfidenceLocalState(window.localStorage);
  return createQuickPracticeSelection({
    evidence,
    preferredPathId,
    durationMinutes,
    assessments: premiumAssessmentContext(assessmentAware, studyPlan.setup?.assessments ?? []),
    learnerConfidence: new Map(Object.values(confidence.ratings).map((rating) => [rating.skillPathId, rating.level])),
  });
}
