"use client";

import { ChevronLeft, ChevronRight, Delete } from "lucide-react";
import type { RefObject } from "react";
import {
  clearInput,
  deleteAtSelection,
  insertAtSelection,
  moveCaret,
  wrapOrInsertOpeningBracket,
  type TextSelectionEdit,
} from "@/lib/questions/math-input-edit";
import type { MathInputCapabilities } from "@/lib/questions/math-input-capabilities";

type MathKeypadProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  disabled?: boolean;
  capabilities?: MathInputCapabilities;
};

type KeyAction =
  | { label: string; insert: string; ariaLabel?: string }
  | { label: string; action: "opening-bracket" | "left" | "right" | "delete" | "clear"; ariaLabel: string };

const powerActions: KeyAction[] = [
    { label: "x", insert: "x", ariaLabel: "Insert x" },
    { label: "x\u00b2", insert: "x^2", ariaLabel: "Insert x squared" },
    { label: "x\u00b3", insert: "x^3", ariaLabel: "Insert x cubed" },
    { label: "x\u207f", insert: "x^", ariaLabel: "Insert x to a power" },
    { label: "^", insert: "^", ariaLabel: "Insert exponent" },
];
const operatorActions: KeyAction[] = [
    { label: "+", insert: "+", ariaLabel: "Insert plus" },
    { label: "-", insert: "-", ariaLabel: "Insert minus" },
    { label: "*", insert: "*", ariaLabel: "Insert multiplication" },
    { label: "/", insert: "/", ariaLabel: "Insert division slash" },
];
const bracketActions: KeyAction[] = [
    { label: "(", action: "opening-bracket", ariaLabel: "Insert opening bracket or wrap selection" },
    { label: ")", insert: ")", ariaLabel: "Insert closing bracket" },
];

const editActions: KeyAction[] = [
  { label: "left", action: "left", ariaLabel: "Move cursor left" },
  { label: "right", action: "right", ariaLabel: "Move cursor right" },
  { label: "delete", action: "delete", ariaLabel: "Delete previous character" },
  { label: "Clear", action: "clear", ariaLabel: "Clear answer" },
];

export function MathKeypad({ value, onChange, inputRef, disabled = false, capabilities = { squareRoot: false, pi: false } }: MathKeypadProps) {
  const supportedFunctionActions: KeyAction[] = [
    ...(capabilities.squareRoot ? [{ label: "\u221a", insert: "sqrt(", ariaLabel: "Insert square root text" }] : []),
    ...(capabilities.pi ? [{ label: "\u03c0", insert: "pi", ariaLabel: "Insert pi text" }] : []),
  ];
  function applyEdit(edit: TextSelectionEdit) {
    onChange(edit.value);
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  }

  function selection() {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    return { start, end: input?.selectionEnd ?? start };
  }

  function handleKey(keyAction: KeyAction) {
    if (disabled) return;
    const { start, end } = selection();
    if ("insert" in keyAction) {
      applyEdit(insertAtSelection(value, start, end, keyAction.insert));
      return;
    }
    if (keyAction.action === "opening-bracket") applyEdit(wrapOrInsertOpeningBracket(value, start, end));
    if (keyAction.action === "left" || keyAction.action === "right") applyEdit(moveCaret(value, start, end, keyAction.action));
    if (keyAction.action === "delete") applyEdit(deleteAtSelection(value, start, end));
    if (keyAction.action === "clear") applyEdit(clearInput());
  }

  function KeyButton({ keyAction }: { keyAction: KeyAction }) {
    const isClear = "action" in keyAction && keyAction.action === "clear";
    return (
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => handleKey(keyAction)}
        aria-label={keyAction.ariaLabel ?? keyAction.label}
        className={`min-h-11 rounded-md border bg-white px-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge/40 disabled:cursor-not-allowed disabled:opacity-45 ${isClear ? "border-danger/30 text-danger hover:border-danger" : "border-line text-ink hover:border-forge hover:text-forge"}`}
      >
        {keyAction.label === "left" ? <ChevronLeft aria-hidden="true" className="mx-auto size-5" />
          : keyAction.label === "right" ? <ChevronRight aria-hidden="true" className="mx-auto size-5" />
            : keyAction.label === "delete" ? <Delete aria-hidden="true" className="mx-auto size-5" />
              : keyAction.label}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-paper p-2.5" role="group" aria-label="Maths input toolbar">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs font-extrabold uppercase text-forge">Optional keypad</p>
        <p className="m-0 text-xs font-semibold text-muted">Use ^ for powers, for example 5x^4.</p>
      </div>
      <div className="grid gap-3">
        <div>
          <p className="mb-1.5 text-xs font-bold text-muted">Maths</p>
          <div className="grid gap-1.5">
            <div className="grid grid-cols-5 gap-1.5">{powerActions.map((keyAction) => <KeyButton key={keyAction.label} keyAction={keyAction} />)}</div>
            <div className="grid grid-cols-4 gap-1.5">{operatorActions.map((keyAction) => <KeyButton key={keyAction.label} keyAction={keyAction} />)}</div>
            <div className="grid grid-cols-2 gap-1.5">{bracketActions.map((keyAction) => <KeyButton key={keyAction.label} keyAction={keyAction} />)}</div>
            {supportedFunctionActions.length ? (
              <div className="grid grid-cols-2 gap-1.5">{supportedFunctionActions.map((keyAction) => <KeyButton key={keyAction.label} keyAction={keyAction} />)}</div>
            ) : null}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold text-muted">Edit</p>
          <div className="grid grid-cols-4 gap-1.5">
            {editActions.map((keyAction) => <KeyButton key={keyAction.label} keyAction={keyAction} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
