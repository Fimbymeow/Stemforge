import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { LockedCard } from "@/components/locked-card";

export function ResourcesPage() {
  return (
    <AppShell demo active="Current Path">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1120px] gap-4">
        <header>
          <h1 className="m-0 text-[32px] font-extrabold leading-none">Resources</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">
            STEM Forge resources will support SQA-style topics once they are part of the active Higher Maths study flow.
          </p>
        </header>
        <Card className="p-4">
          <div className="grid grid-cols-[auto_1fr] gap-4 max-md:grid-cols-1">
            <span className="grid size-10 place-items-center rounded-xl bg-forge-soft text-forge">
              <FileText className="size-5" />
            </span>
            <div>
              <p className="m-0 text-sm font-extrabold uppercase text-forge">Coming soon</p>
              <h2 className="mt-2 text-xl font-extrabold">Higher Maths resources</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Formula references and topic resources will be added carefully once they fit the Basic differentiation practice flow.
              </p>
              <Link href={getActiveSkillPathHref()} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
                Back to Basic differentiation
              </Link>
            </div>
          </div>
        </Card>
        <LockedCard
          title="Higher Physics formula and data sheets"
          description="Higher Physics reference PDFs are kept secondary for now because Physics is coming soon and is not part of the active study flow yet."
          badge="Locked"
        />
      </div>
    </AppShell>
  );
}




