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
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-xl">
      <nav className="mx-auto grid min-h-[70px] w-[min(1220px,calc(100%_-_40px))] grid-cols-[1fr_auto_1fr] items-center gap-9 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-3 max-md:py-4">
        <Link href="/tuition" className="justify-self-start max-md:justify-self-center" aria-label="STEM Forge Tuition home">
          <Image src="/assets/stemforge-logo-header.png" alt="STEM Forge" width={300} height={91} className="h-auto w-[150px]" priority />
        </Link>
        <div className="flex items-center gap-4 text-[13px] font-semibold text-[#1f1d1a]">
          {navItems.map(([label, href]) => (
            <Link key={label} href={href} className={pathname === href ? "text-forge" : ""}>
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 justify-self-end max-md:justify-self-center">
          <Link href="/" className="text-[13px] font-semibold text-muted">
            Back to STEM Forge
          </Link>
          <TuitionButtonLink href="/tuition#contact">Book a session</TuitionButtonLink>
        </div>
      </nav>
    </header>
  );
}
