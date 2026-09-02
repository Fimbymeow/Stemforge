import type { ReactNode } from "react";
import { Surface } from "@/components/ui";

export function AccountSettingsSection({
  id,
  title,
  description,
  danger = false,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div>
        <h2 id={id} className={`m-0 text-base font-extrabold ${danger ? "text-danger" : "text-ink"}`}>{title}</h2>
        {description ? <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      <Surface level="secondary" className={danger ? "overflow-hidden border-danger/30" : "overflow-hidden"}>
        <div className="divide-y divide-line">{children}</div>
      </Surface>
    </section>
  );
}

export function AccountSettingsRow({
  title,
  description,
  value,
  children,
  danger = false,
  testId,
}: {
  title: string;
  description?: string;
  value?: ReactNode;
  children?: ReactNode;
  danger?: boolean;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-5" data-testid={testId}>
      <div className="min-w-0 flex-1">
        <h3 className={`m-0 text-sm font-extrabold ${danger ? "text-danger" : "text-ink"}`}>{title}</h3>
        {description ? <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {value ? <div className="min-w-0 shrink-0 break-all text-sm font-semibold text-ink sm:max-w-[55%] sm:text-right">{value}</div> : null}
      {children ? <div className="min-w-0 shrink-0 sm:max-w-[55%]">{children}</div> : null}
    </div>
  );
}
