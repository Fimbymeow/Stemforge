"use client";

import { useEffect, useState } from "react";
import { FlaskConical, X } from "lucide-react";

const NOTICE_KEY = "stemforge.betaNotice.dismissed.v1";

export function BetaNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(NOTICE_KEY) !== "true");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;
  return (
    <aside className="pointer-events-none fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-2xl rounded-2xl border border-forge/20 bg-white p-4 shadow-xl md:left-auto md:right-4 md:max-w-md" aria-label="Private beta notice">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forge-soft text-forge">
          <FlaskConical className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-extrabold">Private beta</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">STEM Forge is in private beta. If something looks wrong, send a quick report and we&apos;ll look into it.</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss private beta notice"
          onClick={() => {
            try { window.localStorage.setItem(NOTICE_KEY, "true"); } catch {}
            setVisible(false);
          }}
          className="pointer-events-auto rounded-full border border-line p-1.5 text-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
