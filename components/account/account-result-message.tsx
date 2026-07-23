"use client";

import { useEffect, useRef } from "react";
import type { AuthResultCode } from "@/lib/auth/results";

const ERROR_RESULTS = new Set<AuthResultCode>([
  "callback_invalid",
  "invalid_credentials",
  "password_invalid",
  "unverified_email",
  "unexpected",
]);

export function AccountResultMessage({ code, message }: { code: AuthResultCode; message: string }) {
  const error = ERROR_RESULTS.has(code);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) ref.current?.focus();
  }, [error]);

  return (
    <p
      ref={ref}
      id="account-result"
      role={error ? "alert" : "status"}
      tabIndex={error ? -1 : undefined}
      className="mt-5 rounded-lg border border-line bg-forge-soft p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-forge"
    >
      {message}
    </p>
  );
}
