"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/account/account-shell";

export function SubmitButton({ idle, pending, className = buttonClass }: { idle: string; pending: string; className?: string }) {
  const status = useFormStatus();
  return <button className={className} type="submit" disabled={status.pending}>{status.pending ? pending : idle}</button>;
}

export function GoogleSignInSubmitButton() {
  const status = useFormStatus();
  return (
    <button
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-6 text-sm font-extrabold text-ink transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-60"
      type="submit"
      disabled={status.pending}
    >
      {!status.pending ? <Image data-testid="google-provider-icon" src="/assets/google-g.svg" alt="" aria-hidden="true" width={18} height={18} /> : null}
      {status.pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
