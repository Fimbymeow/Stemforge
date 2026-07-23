"use client";

import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Compass, Home, UserRound } from "lucide-react";
import { useAuthFeatureAvailable } from "@/components/auth-feature-provider";

const navItems = [
  ["Dashboard", Home, "dashboard", "Dashboard"],
  ["Subjects", BookOpen, "subjects", "Subjects"],
  ["Current Path", Compass, "current-path", "Path"],
] as const;

export function AppSidebar({ demo, active = "Dashboard" }: { demo: boolean; active?: string }) {
  const accountsAvailable = useAuthFeatureAvailable();
  const visibleNavItems = accountsAvailable
    ? [...navItems, ["Account", UserRound, "account", "Account"] as const]
    : navItems;
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-[268px] flex-col border-r border-line bg-paper/90 px-5 py-8 backdrop-blur-xl max-xl:sticky max-xl:top-0 max-xl:h-auto max-xl:w-full max-xl:border-b max-xl:border-r-0 max-xl:px-5 max-xl:py-4">
      <Link href="/" className="mb-11 block w-[210px] max-xl:mb-3 max-xl:w-[156px]">
        <Image src="/assets/stemforge-logo-header.png" alt="STEM Forge" width={300} height={91} />
      </Link>
      <Link
        href="/"
        className="mb-4 inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-bold text-muted max-xl:hidden"
      >
        Back to website
      </Link>
      <nav aria-label="Main" className="grid gap-3 max-xl:flex max-xl:gap-1">
        {visibleNavItems.map(([label, Icon, key, shortLabel]) => (
          <Link
            key={label}
            href={getAppNavHref(key, demo)}
            className={`flex min-h-[58px] items-center justify-center rounded-xl px-5 text-lg font-semibold max-xl:min-h-11 max-xl:flex-1 max-xl:justify-center max-xl:px-2 max-xl:text-sm ${
              label === active ? "bg-forge-soft text-forge" : "text-ink"
            }`}
          >
            <Icon className="mr-4 size-6 max-xl:hidden" strokeWidth={2} />
            <span className="max-xl:hidden">{label}</span>
            <span className="hidden max-xl:inline">{shortLabel}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-line bg-white p-5 shadow-card max-xl:hidden">
        <p className="m-0 text-sm font-extrabold uppercase text-forge">Available now</p>
        <strong className="mt-3 block text-lg">Basic differentiation</strong>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Higher Maths is available now. Higher Physics is coming soon.</p>
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
