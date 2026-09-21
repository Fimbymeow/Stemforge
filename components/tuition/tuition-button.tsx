import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Sentence-case button for the tuition sub-brand — distinct from the main site's uppercase
 * ButtonLink (a deliberate brand-register choice elsewhere). Nabla's own buttons are sentence
 * case; matching that reads calmer here than shouting in caps on every CTA.
 */
export function TuitionButtonLink({
  href,
  children,
  variant = "primary",
  size = "sm",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "lg";
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? "border border-forge bg-forge text-white hover:bg-[#0b2b4a]"
      : "border border-line bg-white text-ink hover:border-forge/45 hover:bg-forge-soft/30";
  const sizeClass = size === "lg" ? "min-h-12 px-6 text-[15px]" : "min-h-11 px-5 text-sm";

  return (
    <Link
      href={href}
      className={`tuition-interactive inline-flex items-center justify-center rounded-md font-semibold ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </Link>
  );
}
