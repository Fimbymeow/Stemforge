"use client";

import { useEffect, useRef } from "react";
import type { PracticeActivationConflict } from "@/lib/practice/practice-activation";

export function PracticeActivationDialog({
  conflict,
  busy,
  onResume,
  onReplace,
  onCancel,
}: {
  conflict: PracticeActivationConflict;
  busy: boolean;
  onResume: () => void;
  onReplace: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-3" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="practice-conflict-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-card">
        <h2 id="practice-conflict-title" className="m-0 text-xl font-extrabold">You already have active practice</h2>
        <p className="mt-2 text-muted">
          {conflict.resolvable
            ? "Resume that session, replace it with this one, or cancel. Recorded progress will not be deleted."
            : "The active session contains unavailable content. Replace it with this session or cancel; it will not be discarded silently."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {conflict.resolvable ? (
            <button type="button" onClick={onResume} disabled={busy} className="min-h-11 rounded-lg border border-line px-4 font-bold">Resume current session</button>
          ) : null}
          <button type="button" onClick={onReplace} disabled={busy} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Replace and start</button>
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="min-h-11 px-3 font-bold text-muted">Cancel</button>
        </div>
      </div>
    </div>
  );
}
