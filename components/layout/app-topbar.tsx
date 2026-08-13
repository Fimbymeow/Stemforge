import { ProgressSyncStatus } from "@/components/progress-sync-status";

export function AppTopbar({ demo }: { demo: boolean }) {
  void demo;
  return (
    <div className="flex items-center gap-4">
      <ProgressSyncStatus />
    </div>
  );
}
