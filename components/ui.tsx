import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

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

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <article {...props} className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>
      {children}
    </article>
  );
}

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={`h-2 overflow-hidden rounded-full bg-line ${className}`}
    >
      <span
        className="block h-full rounded-full bg-forge transition-[width] duration-500 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
