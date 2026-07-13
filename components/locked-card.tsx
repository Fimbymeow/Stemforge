import { Lock } from "lucide-react";
import { Card } from "@/components/ui";

type LockedCardProps = {
  title: string;
  description: string;
  badge?: string;
  buttonLabel?: string;
  className?: string;
};

export function LockedCard({ title, description, badge = "Coming Soon", buttonLabel = "Coming soon", className = "" }: LockedCardProps) {
  return (
    <Card className={`h-full bg-white/80 p-6 opacity-85 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-forge-soft text-forge">
          <Lock className="size-5" />
        </span>
        <span className="rounded-lg bg-[#f4f1eb] px-3 py-1 text-xs font-extrabold text-muted">{badge}</span>
      </div>
      <h3 className="mb-3 text-2xl font-extrabold">{title}</h3>
      <p className="min-h-[72px] text-muted">{description}</p>
      <div className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-sm font-extrabold text-muted">
        <Lock className="size-4" />
        {buttonLabel}
      </div>
    </Card>
  );
}
