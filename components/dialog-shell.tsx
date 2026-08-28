import { forwardRef, type MouseEventHandler, type ReactNode } from "react";
import { X } from "lucide-react";

const WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-xl",
} as const;

export const DialogShell = forwardRef<HTMLElement, {
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  size?: keyof typeof WIDTH_CLASSES;
  role?: "dialog" | "alertdialog";
  className?: string;
  backdropClassName?: string;
  onBackdropMouseDown?: MouseEventHandler<HTMLDivElement>;
}>(function DialogShell({ children, labelledBy, describedBy, size = "md", role = "dialog", className = "", backdropClassName = "", onBackdropMouseDown }, ref) {
  return (
    <div className={`fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 ${backdropClassName}`} role="presentation" data-dialog-backdrop onMouseDown={onBackdropMouseDown}>
      <section
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`animate-fade-rise max-h-[92dvh] w-full overflow-auto rounded-2xl border border-line bg-white p-5 shadow-hero ${WIDTH_CLASSES[size]} ${className}`}
        data-dialog-shell
      >
        {children}
      </section>
    </div>
  );
});

export const DialogCloseButton = forwardRef<HTMLButtonElement, { label: string; onClick: () => void; className?: string }>(
  function DialogCloseButton({ label, onClick, className = "" }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors duration-150 hover:border-forge/40 hover:text-ink ${className}`}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    );
  },
);
