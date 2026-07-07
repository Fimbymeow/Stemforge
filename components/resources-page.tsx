import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { LockedCard } from "@/components/locked-card";

export function ResourcesPage() {
  return (
    <AppShell demo active="Current Path">
      <div className="mx-auto mb-6 flex max-w-[1240px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-6">
          <header>
            <h1 className="m-0 text-[clamp(38px,4vw,56px)] font-extrabold leading-none">Resources</h1>
            <p className="mt-4 max-w-3xl text-xl leading-relaxed text-muted">
              STEM Forge resources will support SQA-style topics once they are part of the active Higher Maths study flow.
            </p>
          </header>
          <Card className="p-8">
            <div className="grid grid-cols-[auto_1fr] gap-5 max-md:grid-cols-1">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#fff4ec] text-forge">
                <FileText className="size-7" />
              </span>
              <div>
                <p className="m-0 text-sm font-extrabold uppercase text-forge">Coming soon</p>
                <h2 className="mt-2 text-3xl font-extrabold">Higher Maths resources</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                  Formula references and topic resources will be added carefully once they fit the Basic differentiation practice flow.
                </p>
                <ButtonLink href="/subjects/higher-maths/calculus/differentiation/basic-differentiation" className="mt-6">
                  Back to Basic differentiation
                </ButtonLink>
              </div>
            </div>
          </Card>
          <LockedCard
            title="Higher Physics formula and data sheets"
            description="Higher Physics reference PDFs are kept secondary for now because Physics is coming soon and is not part of the active study flow yet."
            badge="Locked"
          />
        </section>
        <aside className="grid content-start gap-5">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-extrabold">Active Path</h2>
            <p className="text-muted">Higher Maths / Calculus / Differentiation / Basic differentiation</p>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Quick Links</h2>
            <div className="grid gap-3">
              <SideLink href="/subjects/higher-maths/calculus/differentiation/basic-differentiation">Basic differentiation</SideLink>
              <SideLink href="/question/hm-calc-diff-basic-f-001">First question</SideLink>
              <SideLink href="/subjects">Subjects</SideLink>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function SideLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-[#fffdf9] px-4 font-bold transition hover:border-forge/45">
      <span>{children}</span>
      <ArrowRight className="size-4 text-forge" />
    </Link>
  );
}


