"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Shuffle, X } from "lucide-react";
import { Card } from "@/components/ui";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { getQuestionBankHref } from "@/lib/learning-paths";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";

export function PracticeEntryCard({
  preferredPathId,
  className = "",
  testId = "practice-entry-card",
}: {
  preferredPathId?: string | null;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const quickDescriptionId = useId();
  const chooseDescriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalFocusTrap({
    open,
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    triggerRef,
    onClose: () => setOpen(false),
  });

  return (
    <>
      <Card data-testid={testId} aria-label="Practice" className={`flex h-full flex-col p-5 ${className}`}>
        <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Practice</p>
        <h2 className="mt-1 text-xl font-extrabold">Practise your way</h2>
        <p id={`${testId}-description`} className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          Start straight away or choose the questions you want to work on.
        </p>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={`${testId}-description`}
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge"
        >
          Practice
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 max-sm:items-end max-sm:p-0" role="presentation">
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-white p-5 shadow-2xl max-sm:rounded-b-none max-sm:p-[max(1rem,env(safe-area-inset-top))_1rem_max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-2xl font-extrabold">Choose how to practise</h2>
                <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
                  Both modes use the same available Higher Maths questions.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close practice chooser"
                className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3" data-testid="practice-mode-options">
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
                    <Shuffle aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold">Quick Practice</h3>
                    <p id={quickDescriptionId} className="mt-1 text-sm leading-relaxed text-muted">
                      Start immediately with a suitable set of available questions.
                    </p>
                  </div>
                </div>
                <QuickPracticeAction
                  preferredPathId={preferredPathId}
                  label="Quick Practice"
                  describedBy={quickDescriptionId}
                  className="mt-4 w-full"
                  testId="practice-chooser-quick"
                />
              </div>

              <div className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
                    <ClipboardList aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold">Choose Questions</h3>
                    <p id={chooseDescriptionId} className="mt-1 text-sm leading-relaxed text-muted">
                      Filter the Question Bank and build your own practice session.
                    </p>
                  </div>
                </div>
                <Link
                  href={getQuestionBankHref()}
                  aria-describedby={chooseDescriptionId}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-forge bg-white px-4 font-extrabold text-forge"
                >
                  Choose Questions
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
