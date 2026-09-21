import type { ReactNode } from "react";
import { TuitionAvatarPlaceholder } from "@/components/tuition/tuition-avatar";
import { lora } from "@/components/tuition/tuition-fonts";
import { TUITION_CARD } from "@/components/tuition/tuition-styles";

export function TuitionTutorCard({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <article className={`${TUITION_CARD} grid grid-cols-[auto_minmax(0,1fr)] gap-5 p-7 max-sm:grid-cols-1 max-sm:p-6 max-sm:text-center`}>
      <div className="max-sm:mx-auto"><TuitionAvatarPlaceholder size="lg" /></div>
      <div>
        <h2 className={`${lora.className} m-0 text-xl font-bold text-ink`}>Finlay Kennedy</h2>
        <p className="mt-1 text-sm font-semibold text-muted">17 · National 5 and Higher Maths &amp; Physics tutor · Scotland</p>
        <div className={`mt-4 leading-relaxed text-muted ${compact ? "text-[15px]" : "text-base"}`}>{children}</div>
      </div>
    </article>
  );
}
