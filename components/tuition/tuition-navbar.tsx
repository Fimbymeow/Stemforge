"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TuitionButtonLink } from "@/components/tuition/tuition-button";

const navItems = [
  ["Home", "/tuition"],
  ["Subjects", "/tuition/subjects"],
  ["About", "/tuition/about"],
  ["Pricing", "/tuition/pricing"],
] as const;

export function TuitionNavbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-md">
      <nav className="mx-auto grid min-h-[72px] w-[min(1220px,calc(100%_-_40px))] grid-cols-[1fr_auto_1fr] items-center gap-8 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-2 max-md:py-3" aria-label="Tuition">
        <Link href="/tuition" className="justify-self-start max-md:justify-self-center" aria-label="Orthic Tuition home">
          <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={260} height={64} className="h-auto w-[132px]" priority />
        </Link>
        <div className="flex min-h-11 items-stretch gap-7 text-sm font-medium text-ink max-sm:w-full max-sm:justify-between max-sm:gap-3">
          {navItems.map(([label, href]) => (
            <Link key={label} href={href} aria-current={pathname === href ? "page" : undefined} className="tuition-nav-link inline-flex min-h-11 items-center">
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 justify-self-end max-md:justify-self-center">
          <Link href="/" className="tuition-interactive text-sm font-medium text-muted hover:text-ink">
            Back to Orthic
          </Link>
          <TuitionButtonLink href="/tuition#contact">Free first session</TuitionButtonLink>
        </div>
      </nav>
    </header>
  );
}
