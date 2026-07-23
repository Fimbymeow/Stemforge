import Link from "next/link";
import { FileText, Layers3, Target } from "lucide-react";
import {
  getStudentResourceCapabilities,
  type SubjectFamily,
  type StudentResourceCapability,
} from "@/lib/resource-capabilities";

const resourcePresentation = {
  notes: { label: "Notes", icon: FileText },
  flashcards: { label: "Flashcards", icon: Layers3 },
  practice: { label: "Practice", icon: Target },
} satisfies Record<StudentResourceCapability, { label: string; icon: typeof FileText }>;

export function SubjectResourceLinks({
  family,
  hrefs,
  current,
  variant = "navigation",
}: {
  family: SubjectFamily;
  hrefs: Record<StudentResourceCapability, string>;
  current?: StudentResourceCapability;
  variant?: "navigation" | "tiles";
}) {
  const capabilities = getStudentResourceCapabilities(family);

  return (
    <nav
      aria-label="Learning resources"
      data-subject-family={family}
      className={`grid gap-2 ${capabilities.length === 3 ? "grid-cols-3" : "grid-cols-2"} max-sm:grid-cols-1`}
    >
      {capabilities.map((capability) => {
        const item = resourcePresentation[capability];
        const Icon = item.icon;
        const active = current === capability;
        return (
          <Link
            key={capability}
            href={hrefs[capability]}
            aria-current={active ? "page" : undefined}
            className={variant === "tiles"
              ? `flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center text-sm font-bold transition hover:-translate-y-0.5 ${capability === "practice" ? "border-forge bg-forge text-white" : "border-line bg-white text-ink hover:border-forge"}`
              : `flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold ${active ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-ink"}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

