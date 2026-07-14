"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/account/account-shell";

export function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return <button className={buttonClass} type="submit" disabled={status.pending}>{status.pending ? pending : idle}</button>;
}
