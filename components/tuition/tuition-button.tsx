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
      ? "bg-forge text-white hover:shadow-card"
      : "border border-line bg-white text-ink hover:border-forge/40 hover:shadow-card";
  const sizeClass = size === "lg" ? "min-h-[52px] px-7 text-base" : "min-h-11 px-6 text-sm";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg font-bold transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:duration-100 ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </Link>
  );
}
