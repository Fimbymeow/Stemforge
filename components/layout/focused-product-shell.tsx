import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function FocusedProductShell({
  children,
  maxWidth = "max-w-lg",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-paper px-4 py-10 text-ink sm:py-14">
      <div className={`mx-auto w-full ${maxWidth}`}>
        <Link href="/" className="mx-auto mb-8 block w-44" aria-label="Orthic home">
          <Image src="/assets/orthic-wordmark.svg" alt="Orthic" width={260} height={64} priority />
        </Link>
        {children}
      </div>
    </main>
  );
}
