"use client";

import { useId, useRef, useState } from "react";
import { FunctionSquare, X } from "lucide-react";
import { MathContent } from "@/components/questions/math-content";
import { higherMathsFormulaSheet } from "@/data/higher-maths-formula-sheet";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";

export function FormulaSheetDrawer() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalFocusTrap({
    open,
    containerRef: drawerRef,
    initialFocusRef: closeRef,
    triggerRef,
    onClose: () => setOpen(false),
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 w-full items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-extrabold text-forge shadow-sm transition hover:border-forge"
      >
        <FunctionSquare aria-hidden="true" className="size-4" />
        Formula sheet
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-ink/35" role="presentation">
          <section
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="fixed inset-y-0 right-0 flex w-full max-w-[340px] flex-col border-l border-line bg-white shadow-2xl max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[90dvh] max-md:max-w-none max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line p-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Official assessment reference</p>
                <h2 id={titleId} className="mt-1 text-xl font-extrabold">{higherMathsFormulaSheet.title}</h2>
                <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-muted">
                  The formulae supplied for Higher Mathematics assessments.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close formula sheet"
                className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="grid gap-5">
                {higherMathsFormulaSheet.sections.map((section) => (
                  <section key={section.id} aria-labelledby={`formula-section-${section.id}`}>
                    <h3 id={`formula-section-${section.id}`} className="mb-2 text-base font-extrabold">{section.title}</h3>
                    {"formulae" in section ? (
                      <div className="grid gap-2">
                        {section.formulae.map((formula) => (
                          <div key={formula} className="min-w-0 overflow-x-auto rounded-lg border border-line bg-paper p-3 text-sm leading-relaxed">
                            <MathContent>{formula}</MathContent>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[250px] border-collapse text-center text-sm">
                          <thead>
                            <tr>
                              {section.table.headings.map((heading) => (
                                <th key={heading} scope="col" className="border border-line bg-paper p-2 font-bold">
                                  <MathContent>{heading}</MathContent>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.table.rows.map((row) => (
                              <tr key={row[0]}>
                                {row.map((cell) => (
                                  <td key={cell} className="border border-line p-2">
                                    <MathContent>{cell}</MathContent>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
