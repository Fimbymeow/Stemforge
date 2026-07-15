"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

// Placeholder until a real contact address is supplied — swap before publishing.
const CONTACT_EMAIL = "tuition@stemforge.app";

const LEVEL_OPTIONS = ["National 5 Maths", "Higher Maths", "National 5 Physics", "Higher Physics", "Not sure yet"] as const;

export function TuitionContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<(typeof LEVEL_OPTIONS)[number]>(LEVEL_OPTIONS[0]);
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(`Tuition enquiry - ${level}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nLevel: ${level}\n\n${message}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="grid grid-cols-[1.3fr_minmax(220px,0.7fr)] gap-6 max-lg:grid-cols-1">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl bg-white p-7">
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Your name">
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-md border border-line px-3 text-sm text-ink"
            />
          </Field>
          <Field label="Your email">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-md border border-line px-3 text-sm text-ink"
            />
          </Field>
        </div>
        <Field label="Level you're interested in">
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as (typeof LEVEL_OPTIONS)[number])}
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Message">
          <textarea
            required
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full resize-y rounded-md border border-line px-3 py-2 text-sm text-ink"
          />
        </Field>
        <div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-ink px-6 text-sm font-extrabold uppercase text-white"
          >
            Send enquiry
          </button>
          <p className="mt-2 text-xs text-white/70">Opens your email app with your message ready to send.</p>
        </div>
      </form>
      <div className="grid content-start gap-3 rounded-xl border border-white/25 p-7 text-white">
        <p className="m-0 text-sm font-bold uppercase tracking-wide text-white/80">Prefer to email directly?</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-lg font-bold text-white underline-offset-4 hover:underline">
          <Mail className="size-5" />
          {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      {label}
      {children}
    </label>
  );
}
