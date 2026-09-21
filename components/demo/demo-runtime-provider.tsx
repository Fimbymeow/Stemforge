"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createDemoRuntime } from "@/lib/demo/runtime";
import type { LearningRuntime } from "@/lib/learning/runtime";

const DemoRuntimeContext = createContext<(LearningRuntime & { reset(): void }) | null>(null);

export function DemoRuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(createDemoRuntime);
  return <DemoRuntimeContext.Provider value={runtime}>{children}</DemoRuntimeContext.Provider>;
}

export function useDemoRuntime() {
  const runtime = useContext(DemoRuntimeContext);
  if (!runtime) throw new Error("Preview learning requires its isolated runtime");
  return runtime;
}
