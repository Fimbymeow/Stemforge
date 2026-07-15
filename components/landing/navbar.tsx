"use client";

import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { useAuthFeatureAvailable } from "@/components/auth-feature-provider";

export function Navbar() {
  const accountsAvailable = useAuthFeatureAvailable();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-xl">
      <nav className="mx-auto grid min-h-[70px] w-[min(1220px,calc(100%_-_40px))] grid-cols-[1fr_auto_1fr] items-center gap-9 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-3 max-md:py-4">
        <Link href="/" className="justify-self-start max-md:justify-self-center" aria-label="STEM Forge home">
          <Image
            src="/assets/stemforge-logo-header.png"
            alt="STEM Forge"
            width={300}
            height={91}
            className="h-auto w-[150px]"
            priority
          />
        </Link>
        <div className="flex items-center gap-4 text-[13px] font-semibold text-[#1f1d1a]">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="/tuition">Tuition</NavLink>
          <Link href="#about">About</Link>
        </div>
        <div className="flex items-center gap-4 justify-self-end text-[13px] font-semibold text-[#1f1d1a] max-md:justify-self-center">
          {accountsAvailable ? <Link href="/account">Account</Link> : null}
          <NavLink href="/dashboard">Dashboard</NavLink>
          <ButtonLink href={getActiveSkillPathHref()}>Get Started</ButtonLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="after:ml-4 after:text-[#a19a8d] after:content-['|']">
      {children}
    </Link>
  );
}
