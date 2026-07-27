"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import { createQuickPracticeSelection } from "@/lib/study-context";
import { useHasMounted } from "@/lib/use-mounted";

export function QuickPracticeAction({
  preferredPathId,
  className = "",
  label = "Start Quick Practice",
  testId = "quick-practice-action",
  describedBy,
}: {
  preferredPathId?: string | null;
  className?: string;
  label?: string;
  testId?: string;
  describedBy?: string;
}) {
  const activation = usePracticeActivation();
  const hasMounted = useHasMounted();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const nextAction = deriveLearnerNextAction({ evidence });
  const quick = useMemo(
    () => createQuickPracticeSelection({ evidence, preferredPathId: preferredPathId ?? nextAction.pathId }),
    [evidence, nextAction.pathId, preferredPathId],
  );
  function begin() {
    const selection = createQuickPracticeSelection({
      evidence: getProgressEvidence(),
      preferredPathId: preferredPathId ?? nextAction.pathId,
    });
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
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white disabled:opacity-45 ${className}`}
      >
        {label}
        <ArrowRight className="size-5" />
      </button>
      {activation.error ? <p role="status" className="text-sm text-red-700">{activation.error}</p> : null}
      {activation.activationUi}
    </>
  );
}
