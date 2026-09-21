"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookOpen, Home, RotateCcw } from "lucide-react";
import { demoNavigation } from "@/lib/demo/content";
import { useDemoRuntime } from "@/components/demo/demo-runtime-provider";

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const runtime = useDemoRuntime();
  const [resetMessage, setResetMessage] = useState("");
  return <div className="min-h-screen bg-canvas text-navy" data-testid="demo-shell">
    <aside className="fixed inset-y-0 left-0 flex w-[240px] flex-col border-r border-rule bg-white max-lg:relative max-lg:w-full max-lg:border-b max-lg:border-r-0">
      <Link aria-label="Orthic preview overview" href={demoNavigation.home} className="flex min-h-20 items-center border-b border-rule px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy max-lg:min-h-16 max-lg:px-4">
        <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={132} height={33} priority />
      </Link>
      <nav aria-label="Preview navigation" className="grid gap-1 py-3 max-lg:flex max-lg:px-4 max-lg:py-2">
        {([["Overview", demoNavigation.home, Home], ["Chain Rule", demoNavigation.skill, BookOpen]] as const).map(([label, href, Icon]) => {
          const active = href === demoNavigation.home ? pathname === href : pathname !== demoNavigation.home;
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`orthic-nav-link flex min-h-11 items-center gap-3 border-l-2 px-6 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy max-lg:flex-1 max-lg:justify-center max-lg:border-l-0 max-lg:px-2 ${active ? "border-navy bg-academic-blue text-navy" : "border-transparent text-secondary hover:bg-academic-blue"}`}>
            <Icon aria-hidden="true" className="size-4 max-sm:hidden" />{label}
          </Link>;
        })}
      </nav>
      <div className="mt-auto px-6 pb-5 max-lg:absolute max-lg:right-4 max-lg:top-2 max-lg:mt-0 max-lg:p-0">
        <button className="orthic-secondary-link inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded text-sm text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy" onClick={() => { runtime.reset(); setResetMessage("Preview reset."); }}>
          <RotateCcw aria-hidden="true" className="size-4" /><span className="max-sm:sr-only">Reset preview</span>
        </button>
        <span role="status" className="sr-only">{resetMessage}</span>
      </div>
    </aside>
    <div className="ml-[240px] max-lg:ml-0">
      <header className="border-b border-rule bg-white px-10 max-md:px-4">
        <div className="mx-auto flex min-h-20 max-w-[1220px] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 max-sm:min-h-16">
          <span className="text-sm font-semibold tracking-wide">Orthic Preview</span>
          <span className="text-xs text-secondary">No account required · Activity resets on refresh</span>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-w-0 max-w-[1300px] px-10 py-8 max-md:px-4 max-sm:py-6">{children}</main>
    </div>
  </div>;
}
