"use client";

import { createContext, type ReactNode, useContext } from "react";

const AuthFeatureContext = createContext(false);

export function AuthFeatureProvider({
  accountsAvailable,
  children,
}: {
  accountsAvailable: boolean;
  children: ReactNode;
}) {
  return <AuthFeatureContext.Provider value={accountsAvailable}>{children}</AuthFeatureContext.Provider>;
}

export function useAuthFeatureAvailable() {
  return useContext(AuthFeatureContext);
}
