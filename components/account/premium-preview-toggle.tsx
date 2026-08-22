"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { usePremiumPreview } from "@/components/premium-preview-provider";

export function PremiumPreviewToggle() {
  const preview = usePremiumPreview();
  const [message, setMessage] = useState<string | null>(null);
  if (!preview.available) return null;

  function toggle(enabled: boolean) {
    setMessage(preview.setEnabled(enabled)
      ? enabled ? "Premium Preview is on in this browser." : "Premium Preview is off. You are seeing the intended free experience."
      : "Premium Preview could not be saved in this browser.");
  }

  return (
    <section data-testid="premium-preview-toggle" className="mt-5 rounded-xl border border-forge/30 bg-forge-soft/45 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-forge"><Sparkles aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-extrabold">Premium Preview</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-forge">Development and testing only</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3 text-sm font-extrabold">
              <span>{preview.enabled ? "On" : "Off"}</span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Premium Preview"
                checked={preview.enabled}
                onChange={(event) => toggle(event.currentTarget.checked)}
                className="size-5 accent-forge"
              />
            </label>
          </div>
          <p className="mb-0 mt-3 text-sm leading-relaxed text-muted">
            Preview assessment-aware Study Plan recommendations, Assessment Readiness and assessment-aware Quick Practice. This local switch is not a subscription or access-control check.
          </p>
          {message ? <p role="status" className="mb-0 mt-2 text-sm font-semibold text-forge">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
