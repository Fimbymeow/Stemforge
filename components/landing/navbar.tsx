"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { OrthicWordmark } from "@/components/brand/orthic-mark";

const navItems = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#courses", label: "Courses" },
  { href: "/tuition", label: "Tuition" },
  { href: "/account", label: "Account" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto flex min-h-[68px] w-[min(1180px,calc(100%_-_32px))] items-center gap-6">
        <Link href="/" aria-label="Orthic home" className="shrink-0">
          <OrthicWordmark />
        </Link>

        <div className="ml-auto hidden items-center gap-7 text-sm font-bold md:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="rounded-sm hover:text-forge">{item.label}</Link>)}
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-forge px-5 font-extrabold text-white">Start Learning</Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-forge px-3 text-sm font-extrabold text-white">Start</Link>
          <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="mobile-primary-menu" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((current) => !current)} className="grid size-11 place-items-center rounded-md border border-line bg-white">
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div ref={menuRef} id="mobile-primary-menu" className="border-t border-line bg-paper px-4 pb-4 md:hidden">
          <div className="mx-auto grid w-full max-w-md divide-y divide-line rounded-b-lg border-x border-b border-line bg-white px-4">
            {navItems.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu} className="flex min-h-12 items-center font-bold">{item.label}</Link>)}
            <Link href="/dashboard" onClick={closeMenu} className="flex min-h-12 items-center font-extrabold text-forge">Start Learning</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
