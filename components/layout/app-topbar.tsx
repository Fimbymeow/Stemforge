import { ProgressSyncStatus } from "@/components/progress-sync-status";

export function AppTopbar({ demo }: { demo: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <ProgressSyncStatus />
      <span className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted sm:inline-flex">
        {demo ? "Higher Maths preview" : "No account connected"}
      </span>
    </div>
  );
}
