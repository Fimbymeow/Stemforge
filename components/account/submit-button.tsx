"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/account/account-shell";

export function SubmitButton({ idle, pending, className = buttonClass }: { idle: string; pending: string; className?: string }) {
  const status = useFormStatus();
  return <button className={className} type="submit" disabled={status.pending}>{status.pending ? pending : idle}</button>;
}
