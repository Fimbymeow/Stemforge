"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  PREMIUM_PREVIEW_STORAGE_KEY,
  PREMIUM_PREVIEW_UPDATED_EVENT,
  readPremiumPreview,
  writePremiumPreview,
} from "@/lib/premium-preview";

type PremiumPreviewContextValue = {
  available: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => boolean;
};

const PremiumPreviewContext = createContext<PremiumPreviewContextValue>({
  available: false,
  enabled: false,
  setEnabled: () => false,
});

export function PremiumPreviewProvider({ available, children }: { available: boolean; children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    if (!available) {
      setEnabledState(false);
      return;
    }
    const read = () => setEnabledState(readPremiumPreview(window.localStorage));
    read();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PREMIUM_PREVIEW_STORAGE_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PREMIUM_PREVIEW_UPDATED_EVENT, read);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PREMIUM_PREVIEW_UPDATED_EVENT, read);
    };
  }, [available]);

  const setEnabled = useCallback((next: boolean) => {
    if (!available || !writePremiumPreview(window.localStorage, next)) return false;
    setEnabledState(next);
    window.dispatchEvent(new Event(PREMIUM_PREVIEW_UPDATED_EVENT));
    return true;
  }, [available]);

  const value = useMemo(() => ({ available, enabled: available && enabled, setEnabled }), [available, enabled, setEnabled]);
  return <PremiumPreviewContext.Provider value={value}>{children}</PremiumPreviewContext.Provider>;
}

export function usePremiumPreview() {
  return useContext(PremiumPreviewContext);
}
