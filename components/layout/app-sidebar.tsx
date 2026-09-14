"use client";

import { getActiveSkillPath, getActiveSkillPathHref, getActiveSubject } from "@/lib/learning-paths";
import { contentResolver } from "@/lib/content-resolver";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Compass, Home, UserRound } from "lucide-react";
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
  const currentPath = workingContextPathId ? contentResolver.getPathContext(workingContextPathId)?.skillPath : getActiveSkillPath();
  const subject = getActiveSubject();
  const [currentDestination, setCurrentDestination] = useState(pathname);
  useEffect(() => {
    setCurrentDestination(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, [pathname]);
  const visibleNavItems = accountsAvailable
    ? [...navItems, ["Account", UserRound, "account", "Account"] as const]
    : navItems;
  return (
    <aside data-app-sidebar className="fixed inset-y-0 left-0 z-10 flex w-[240px] flex-col border-r border-rule bg-white max-lg:sticky max-lg:top-0 max-lg:h-auto max-lg:w-full max-lg:border-b max-lg:border-r-0 max-lg:px-4 max-lg:py-3">
      <Link href="/" className="flex h-20 items-center border-b border-rule px-6 max-lg:mb-3 max-lg:h-auto max-lg:border-0 max-lg:px-0">
        <span className="block w-[132px]">
        <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={260} height={64} />
        </span>
      </Link>
      <div data-testid="sidebar-course-context" className="border-b border-rule px-6 py-5 max-lg:hidden">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">Current course</p>
        <p className="mt-2 text-sm font-medium text-navy">{subject.subjectName}</p>
      </div>
      <nav aria-label="Main" className="grid gap-0.5 py-3 max-lg:flex max-lg:gap-1 max-lg:py-0">
        {visibleNavItems.map(([label, Icon, key, shortLabel]) => {
          const isActive = label === active;
          if (key === "current-path" && workingContextPathId) {
            return <WorkingContextNavigation key={label} pathId={workingContextPathId} active={isActive} />;
          }
          const link = (
            <Link
              href={key === "account" ? accountHrefFor(currentDestination) : getAppNavHref(key, demo)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 w-full items-center border-l-2 px-6 text-sm font-medium transition-colors max-lg:min-h-11 max-lg:justify-center max-lg:border-l-0 max-lg:px-1 max-lg:text-xs sm:max-lg:text-sm ${
                isActive
                  ? "border-navy bg-academic-blue text-navy max-lg:border-b-2 max-lg:border-b-navy"
                  : "border-transparent text-secondary hover:bg-white hover:text-navy max-lg:border-b-0"
              }`}
            >
              <Icon aria-hidden="true" className="mr-3 size-4 max-lg:hidden" strokeWidth={1.5} />
              <span className="max-lg:hidden">{label}</span>
              <span className="hidden max-lg:inline">{shortLabel}</span>
            </Link>
          );
          return key === "account" ? (
            <div key={label} className="mt-4 border-t border-line/70 pt-4 max-lg:mt-0 max-lg:flex-1 max-lg:border-0 max-lg:pt-0">{link}</div>
          ) : <div key={label} className="max-lg:flex-1">{link}</div>;
        })}
      </nav>
      <div className="mt-auto border-t border-rule px-6 py-6 max-lg:hidden">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">Current path</p>
        {currentPath ? <p className="mt-2 text-sm leading-relaxed text-navy">{currentPath.name}</p> : null}
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center text-xs text-secondary hover:text-navy">Back to website <span aria-hidden="true" className="ml-2">↗</span></Link>
      </div>
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
