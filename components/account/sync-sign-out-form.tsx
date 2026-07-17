"use client";

import { useRef, type FormEvent } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { buttonClass } from "@/components/account/account-shell";

export function SyncSignOutForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const sync = useProgressSync();
  const readyToSubmit = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readyToSubmit.current) return;
    event.preventDefault();
    const form = event.currentTarget;
    await sync.pauseForSignOut();
    readyToSubmit.current = true;
    form.requestSubmit();
  }

  return (
    <form action={action} onSubmit={(event) => { void handleSubmit(event); }}>
      <button type="submit" className={buttonClass}>Sign out</button>
    </form>
  );
}
