"use client";

import { Trash2, X } from "lucide-react";
import type { RefObject } from "react";

type MathKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  disabled?: boolean;
};

type KeyAction =
  | { label: string; insert: string; cursorOffset?: number; ariaLabel?: string }
  | { label: string; action: "delete" | "clear"; ariaLabel?: string };

const rows: KeyAction[][] = [
  [
    { label: "x", insert: "x" },
    { label: "x²", insert: "x^2" },
    { label: "x³", insert: "x^3" },
    { label: "x^n", insert: "x^", ariaLabel: "insert x to a power" },
    { label: "+", insert: "+" },
  ],
  [
    { label: "−", insert: "-", ariaLabel: "minus" },
    { label: "*", insert: "*", ariaLabel: "multiply" },
    { label: "/", insert: "/", ariaLabel: "divide" },
    { label: "(", insert: "(" },
    { label: ")", insert: ")" },
  ],
  [
    { label: "^", insert: "^", ariaLabel: "power" },
    { label: "√", insert: "sqrt(", ariaLabel: "square root" },
    { label: "π", insert: "pi", ariaLabel: "pi" },
    { label: "delete", action: "delete", ariaLabel: "delete previous character" },
    { label: "clear", action: "clear", ariaLabel: "clear answer" },
  ],
];

export function MathKeypad({ value, onChange, inputRef, disabled = false }: MathKeypadProps) {
  function focusAndPlaceCursor(position: number) {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(position, position);
    });
  }

  function insertText(snippet: string, cursorOffset = snippet.length) {
    if (disabled) return;
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const nextValue = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
    onChange(nextValue);
    focusAndPlaceCursor(start + cursorOffset);
  }

  function deleteBeforeCursor() {
    if (disabled) return;
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;

    if (start !== end) {
      const nextValue = `${value.slice(0, start)}${value.slice(end)}`;
      onChange(nextValue);
      focusAndPlaceCursor(start);
      return;
    }

    if (start <= 0) return;
    const nextValue = `${value.slice(0, start - 1)}${value.slice(start)}`;
    onChange(nextValue);
    focusAndPlaceCursor(start - 1);
  }

  function clearAnswer() {
    if (disabled || !value) return;
    const confirmed = window.confirm("Clear your current answer?");
    if (!confirmed) return;
    onChange("");
    focusAndPlaceCursor(0);
  }

  function handleKey(action: KeyAction) {
    if ("insert" in action) {
      insertText(action.insert, action.cursorOffset ?? action.insert.length);
      return;
    }

    if (action.action === "delete") deleteBeforeCursor();
    if (action.action === "clear") clearAnswer();
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-[#fffdf9] p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="m-0 text-sm font-extrabold uppercase text-forge">Maths keypad</p>
        <p className="m-0 text-xs font-semibold text-muted">Use ^ for powers, for example 5x^4.</p>
      </div>
      <div className="grid gap-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-2">
            {row.map((key) => (
              <button
                key={key.label}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(key)}
                aria-label={key.ariaLabel ?? key.label}
                className="min-h-11 rounded-lg border border-line bg-white px-2 text-sm font-extrabold text-ink transition hover:border-forge hover:text-forge disabled:cursor-not-allowed disabled:opacity-45 max-sm:min-h-12"
              >
                {key.label === "delete" ? <Trash2 className="mx-auto size-4" /> : key.label === "clear" ? <X className="mx-auto size-4" /> : key.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}