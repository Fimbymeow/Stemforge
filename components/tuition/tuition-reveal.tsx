import type { ReactNode } from "react";

/**
 * Layout wrapper retained for consistent section composition. Tuition pages intentionally avoid
 * decorative entrance animation; only direct interaction states use motion.
 */
export function TuitionReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  void delayMs;

  return (
    <div className={className}>
      {children}
    </div>
  );
}
