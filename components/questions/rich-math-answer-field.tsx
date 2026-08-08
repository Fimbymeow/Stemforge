"use client";

import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import type { MathInputCapabilities } from "@/lib/questions/math-input-capabilities";

type Props = {
  value: string;
  onChange: (value: string) => void;
  capabilities: MathInputCapabilities;
  disabled: boolean;
  inputId: string;
  describedBy?: string;
  invalid?: boolean;
};

export function RichMathAnswerField({ value, onChange, capabilities, disabled, inputId, describedBy, invalid }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let active = true;
    const host = hostRef.current;
    if (!host) return;
    if (new URLSearchParams(window.location.search).get("mathInputFallback") === "1") {
      setFallback(true);
      return;
    }
    void import("mathlive").then(({ MathfieldElement }) => {
      if (!active) return;
      MathfieldElement.fontsDirectory = null;
      MathfieldElement.soundsDirectory = null;
      const field = new MathfieldElement();
      field.id = inputId;
      field.setAttribute("aria-label", "Your answer");
      field.setAttribute("data-testid", "rich-math-field");
      if (describedBy) field.setAttribute("aria-describedby", describedBy);
      if (invalid) field.setAttribute("aria-invalid", "true");
      field.mathVirtualKeyboardPolicy = "manual";
      field.smartFence = true;
      field.smartSuperscript = true;
      field.readOnly = disabled;
      field.value = valueRef.current;
      field.addEventListener("input", () => onChangeRef.current(field.getValue("latex")));
      host.replaceChildren(field);
      field.menuItems = [];
      for (const control of field.shadowRoot?.querySelectorAll<HTMLElement>("[part~='menu-toggle'], [part~='virtual-keyboard-toggle']") ?? []) {
        control.hidden = true;
        control.tabIndex = -1;
        control.setAttribute("aria-hidden", "true");
      }
      fieldRef.current = field;
      setReady(true);
    }).catch(() => {
      if (active) setFallback(true);
    });
    return () => {
      active = false;
      fieldRef.current = null;
      host.replaceChildren();
    };
    // Keep one editor instance for this answer field; the following effects synchronize changing props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputId]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || field.getValue("latex") === value) return;
    field.setValue(value, { selectionMode: "after" });
  }, [value]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.readOnly = disabled;
    if (describedBy) field.setAttribute("aria-describedby", describedBy);
    else field.removeAttribute("aria-describedby");
    if (invalid) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    const focusTimer = invalid ? window.setTimeout(() => field.focus(), 100) : undefined;
    return () => { if (focusTimer !== undefined) window.clearTimeout(focusTimer); };
  }, [describedBy, disabled, invalid]);

  function insert(latex: string) {
    const field = fieldRef.current;
    if (!field || disabled) return;
    field.insert(latex, { selectionMode: "placeholder" });
    field.focus();
  }

  function command(command: string) {
    const field = fieldRef.current;
    if (!field || disabled) return;
    field.executeCommand(command as never);
    field.focus();
  }

  if (fallback) {
    return (
      <div data-testid="rich-math-fallback">
        <input
          id={inputId}
          aria-label="Your answer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          maxLength={2048}
          placeholder="Example: 5x^4"
          className="min-h-12 w-full rounded-lg border border-line bg-white px-4 text-lg outline-none transition focus:border-forge focus:ring-2 focus:ring-forge/15 disabled:bg-line/40"
        />
        <p className="mt-2 text-sm leading-relaxed text-muted">Maths formatting is unavailable. Type a plain expression using ^ for powers and * for multiplication.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0" data-testid="rich-math-input">
      <div
        ref={hostRef}
        onKeyDownCapture={(event) => {
          if (event.key !== "Enter" || event.shiftKey || disabled) return;
          event.preventDefault();
          event.currentTarget.closest("form")?.requestSubmit();
        }}
        className="mathlive-host min-h-14 w-full min-w-0 overflow-x-auto rounded-xl border border-line bg-white px-3 py-2 focus-within:border-forge focus-within:ring-2 focus-within:ring-forge/15"
      />
      <div className="mt-2 min-h-11">
        {!ready ? <p role="status" className="py-2 text-sm text-muted">Loading maths input…</p> : null}
        {ready ? (
          <button type="button" className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm font-bold" aria-expanded={keyboardVisible} aria-controls="stemforge-math-keyboard" onClick={() => setKeyboardVisible((shown) => !shown)}>
            {keyboardVisible ? "Hide maths keyboard" : "Show maths keyboard"}
          </button>
        ) : null}
      </div>
      {ready && keyboardVisible ? (
        <div id="stemforge-math-keyboard" data-testid="maths-keyboard" role="group" aria-label="Maths keyboard" className="mt-2 grid grid-cols-6 gap-1.5 rounded-xl border border-line bg-paper p-2 max-sm:grid-cols-5">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "x", "+", "-", "(", ")"].map((key) => (
                <Key key={key} label={key} onClick={() => insert(key)} />
              ))}
              {capabilities.nonNegativeIntegerPowers ? <Key label="xⁿ" accessibleLabel="Power" onClick={() => insert("^{#0}")} /> : null}
              {capabilities.negativeIntegerPowers ? <Key label="x⁻ⁿ" accessibleLabel="Negative power" onClick={() => insert("^{-#0}")} /> : null}
              {capabilities.halfPowers ? <Key label="x⁻¹⁄²" accessibleLabel="Negative half power" onClick={() => insert("^{-\\frac{1}{2}}")}/> : null}
              {capabilities.numericFractions ? <Key label="a⁄b" accessibleLabel="Fraction" onClick={() => insert("\\frac{#0}{#?}")} /> : null}
              {capabilities.boundedReciprocalSquareRoots ? <Key label="1⁄√x" accessibleLabel="Reciprocal square root" onClick={() => insert("\\frac{1}{\\sqrt{#0}}")}/> : null}
              <Key label="←" accessibleLabel="Move left" onClick={() => command("moveToPreviousChar")} />
              <Key label="→" accessibleLabel="Move right" onClick={() => command("moveToNextChar")} />
              <Key label="⌫" accessibleLabel="Backspace" onClick={() => command("deleteBackward")} />
              <Key label="Undo" onClick={() => command("undo")} />
              <Key label="Redo" onClick={() => command("redo")} />
        </div>
      ) : null}
    </div>
  );
}

function Key({ label, accessibleLabel, onClick }: { label: string; accessibleLabel?: string; onClick: () => void }) {
  return <button type="button" aria-label={accessibleLabel} className="min-h-11 min-w-11 rounded-lg border border-line bg-white px-2 text-sm font-bold text-ink hover:border-forge" onClick={onClick}>{label}</button>;
}
