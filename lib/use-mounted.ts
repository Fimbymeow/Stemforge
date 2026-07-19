"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const browserSnapshot = () => true;
const serverSnapshot = () => false;

export function useHasMounted() {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
}
