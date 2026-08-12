"use client";

import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, Home, UserRound } from "lucide-react";
import { useAuthFeatureAvailable } from "@/components/auth-feature-provider";
import { usePathname } from "next/navigation";
import { accountHrefFor } from "@/lib/auth/redirects";
import { useEffect, useState } from "react";
import { WorkingContextNavigation } from "@/components/working-context/working-context-navigation";

const navItems = [
  ["Dashboard", Home, "dashboard", "Dashboard"],
  ["Subjects", BookOpen, "subjects", "Subjects"],
  ["Current Path", Compass, "current-path", "Path"],
] as const;

export function AppSidebar({
  demo,
  active = "Dashboard",
  workingContextPathId,
}: {
  demo: boolean;
  active?: string;
  workingContextPathId?: string | null;
}) {
  const accountsAvailable = useAuthFeatureAvailable();
  const pathname = usePathname();
  const [currentDestination, setCurrentDestination] = useState(pathname);
  useEffect(() => {
    setCurrentDestination(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, [pathname]);
  const visibleNavItems = accountsAvailable
    ? [...navItems, ["Account", UserRound, "account", "Account"] as const]
    : navItems;
  return (
    <aside data-app-sidebar className="fixed inset-y-0 left-0 z-10 flex w-[240px] flex-col border-r border-line/70 bg-paper px-4 py-6 max-xl:sticky max-xl:top-0 max-xl:h-auto max-xl:w-full max-xl:border-b max-xl:border-r-0 max-xl:px-4 max-xl:py-3">
      <Link href="/" className="mb-8 block w-[178px] max-xl:mb-3 max-xl:w-[146px]">
        <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={260} height={64} />
      </Link>
      <Link
        href="/"
        className="mb-5 inline-flex min-h-10 items-center gap-2 px-3 text-sm font-bold text-muted hover:text-ink max-xl:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />Back to website
      </Link>
      <nav aria-label="Main" className="grid gap-1 max-xl:flex max-xl:gap-1">
        {visibleNavItems.map(([label, Icon, key, shortLabel]) => {
          const isActive = label === active;
          if (key === "current-path" && workingContextPathId) {
            return <WorkingContextNavigation key={label} pathId={workingContextPathId} active={isActive} />;
          }
          const link = (
            <Link
              href={key === "account" ? accountHrefFor(currentDestination) : getAppNavHref(key, demo)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 w-full items-center rounded-lg border-l-2 px-3 text-sm font-bold transition-colors max-xl:min-h-11 max-xl:justify-center max-xl:border-l-0 max-xl:px-1 max-xl:text-xs sm:max-xl:text-sm ${
                isActive
                  ? "border-forge bg-forge-soft text-forge max-xl:border-b-2 max-xl:border-b-forge"
                  : "border-transparent text-ink hover:bg-white hover:text-forge max-xl:border-b-0"
              }`}
            >
              <Icon aria-hidden="true" className="mr-3 size-5 max-xl:hidden" strokeWidth={2} />
              <span className="max-xl:hidden">{label}</span>
              <span className="hidden max-xl:inline">{shortLabel}</span>
            </Link>
          );
          return key === "account" ? (
            <div key={label} className="mt-4 border-t border-line/70 pt-4 max-xl:mt-0 max-xl:flex-1 max-xl:border-0 max-xl:pt-0">{link}</div>
          ) : <div key={label} className="max-xl:flex-1">{link}</div>;
        })}
      </nav>
    </aside>
  );
}

function getAppNavHref(key: string, demo: boolean) {
  void demo;
  if (key === "dashboard") return "/dashboard";
  if (key === "subjects") return "/subjects";
  if (key === "account") return "/account";
  return getActiveSkillPathHref();
}
