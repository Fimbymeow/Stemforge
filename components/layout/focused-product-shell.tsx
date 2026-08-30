import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function FocusedProductShell({
  children,
  maxWidth = "max-w-lg",
  compact = false,
}: {
  children: ReactNode;
  maxWidth?: string;
  compact?: boolean;
}) {
  return (
    <main id="main-content" tabIndex={-1} className={`min-h-screen bg-paper px-4 text-ink ${compact ? "py-6 sm:py-10" : "py-10 sm:py-14"}`}>
      <div className={`mx-auto w-full ${maxWidth}`}>
        <Link href="/" className={`mx-auto block w-44 ${compact ? "mb-6" : "mb-8"}`} aria-label="Orthic home">
          <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={260} height={64} priority />
        </Link>
        {children}
      </div>
    </main>
  );
}
