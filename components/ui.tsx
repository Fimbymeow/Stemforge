import Link from "next/link";
import React, { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export type SurfaceLevel = "primary" | "secondary" | "inline";

/**
 * Orthic surface hierarchy:
 * primary = one dominant page action/state; secondary = quiet list/container;
 * inline = low-weight supporting panel or disclosure content.
 */
export const SURFACE_LEVEL_CLASSES: Record<SurfaceLevel, string> = {
  primary: "rounded-2xl border border-line bg-white shadow-card",
  secondary: "rounded-xl border border-line bg-white",
  inline: "rounded-lg bg-paper",
};

export function Surface({ level = "secondary", children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { level?: SurfaceLevel }) {
  return <div {...props} className={`${SURFACE_LEVEL_CLASSES[level]} ${className}`}>{children}</div>;
}

export type StatusPillVariant = "neutral" | "forge" | "success" | "warning" | "danger";

export const STATUS_PILL_VARIANT_CLASSES: Record<StatusPillVariant, string> = {
  neutral: "border-line bg-paper text-muted",
  forge: "border-forge/20 bg-forge-soft text-forge",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
};

export function StatusPill({ children, variant = "neutral", icon, dot = false, className = "" }: {
  children: ReactNode;
  variant?: StatusPillVariant;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${STATUS_PILL_VARIANT_CLASSES[variant]} ${className}`}>
      {icon ? <span aria-hidden="true" className="shrink-0">{icon}</span> : null}
      {dot ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      <span>{children}</span>
    </span>
  );
}

export function Eyebrow({ as: Component = "p", children, className = "", id }: {
  as?: "p" | "span" | "h2" | "h3" | "h4";
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <Component id={id} className={`text-xs font-extrabold uppercase tracking-wide ${className}`}>{children}</Component>;
}

export const PAGE_HEADER_ICON_CHIP_CLASSES = "mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-forge-soft bg-forge-soft text-forge";

export function PageHeaderIconChip({ children, className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return <span {...props} className={`${PAGE_HEADER_ICON_CHIP_CLASSES} ${className}`}>{children}</span>;
}

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
export type ButtonSize = "sm" | "md";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border-forge bg-forge text-white hover:bg-forge/90",
  secondary: "border-line bg-white text-ink hover:border-forge/45 hover:bg-paper",
  quiet: "border-transparent bg-transparent text-ink hover:bg-forge-soft",
  destructive: "border-danger bg-danger text-white hover:bg-danger/90",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
};

const BUTTON_INTERACTION_CLASSES = "transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-45";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }>(
  function Button({ variant = "primary", size = "md", type = "button", className = "", children, ...props }, ref) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border font-extrabold ${BUTTON_SIZE_CLASSES[size]} ${BUTTON_VARIANT_CLASSES[variant]} ${BUTTON_INTERACTION_CLASSES} ${className}`}
      >
        {children}
      </button>
    );
  },
);

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
      className={`inline-flex items-center justify-center rounded-lg border px-6 text-sm font-extrabold uppercase ${variantClass} ${sizeClass} ${BUTTON_INTERACTION_CLASSES} ${className}`}
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
    <article {...props} className={`${SURFACE_LEVEL_CLASSES.primary} ${className}`}>
      {children}
    </article>
  );
}

type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      aria-label={label}
      className={`h-2 overflow-hidden rounded-full bg-line ${className}`}
    >
      <span
        className="block h-full rounded-full bg-forge transition-[width] duration-500 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
