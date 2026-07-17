import { Bell } from "lucide-react";
import { ProgressSyncStatus } from "@/components/progress-sync-status";

export function AppTopbar({ demo }: { demo: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <ProgressSyncStatus />
      <span className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted sm:inline-flex">
        {demo ? "Higher Maths preview" : "No account connected"}
      </span>
      <button className="relative grid size-11 place-items-center rounded-full border border-line bg-white" aria-label="Notifications">
        <Bell className="size-5" />
      </button>
      <button className="grid size-14 place-items-center rounded-full bg-forge-soft text-forge text-2xl font-extrabold" aria-label="Profile preview">
        F
      </button>
    </div>
  );
}
