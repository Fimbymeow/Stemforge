import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "lg";
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "sm",
  className = "",
}: ButtonLinkProps) {
  const variantClass =
    variant === "primary"
      ? "border-forge bg-forge text-white"
      : "border-ink bg-transparent text-ink";
  const sizeClass = size === "lg" ? "min-h-[54px] min-w-[170px]" : "min-h-11";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md border px-6 text-sm font-extrabold uppercase ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </Link>
  );
}

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>
      {children}
    </article>
  );
}

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-[#eeeae3] ${className}`}>
      <span
        className="block h-full rounded-full bg-forge"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
