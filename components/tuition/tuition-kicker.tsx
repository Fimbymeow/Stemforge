import type { ReactNode } from "react";

/**
 * The warm pill-badge kicker used across every tuition page — reuses the design system's
 * existing (previously unused in UI) `warning` token as a deliberate second accent, alongside
 * forge blue, for this sub-brand only. Not a bare uppercase text line: a contained badge shape.
 */
export function TuitionKicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-warning-soft px-5 py-1.5 text-[12.5px] font-extrabold uppercase tracking-wide text-warning ${className}`}
    >
      {children}
    </span>
  );
}

/** The italic serif emphasis word/phrase used once in every page heading. */
export function TuitionEmphasis({ children }: { children: ReactNode }) {
  return <em className="italic text-warning">{children}</em>;
}
