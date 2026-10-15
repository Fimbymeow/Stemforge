import type { ReactNode } from "react";

/**
 * Restrained editorial eyebrow shared by the tuition site.
 */
export function TuitionKicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-warning ${className}`}
    >
      {children}
    </span>
  );
}

/** The italic serif emphasis word/phrase used once in every page heading. */
export function TuitionEmphasis({ children }: { children: ReactNode }) {
  return <em className="italic text-warning">{children}</em>;
}
