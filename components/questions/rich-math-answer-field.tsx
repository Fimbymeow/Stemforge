"use client";

import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import type { MathInputCapabilities } from "@/lib/questions/math-input-capabilities";
import { deriveElementaryMathKeyboardControls } from "@/lib/questions/math-keyboard-controls";

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
  const elementaryControls = deriveElementaryMathKeyboardControls(capabilities);
  const hasFunctions = elementaryControls.length > 0;

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
    <div className="min-w-0 rounded-xl border border-line bg-white p-2" data-testid="rich-math-input">
      <div
        ref={hostRef}
        onKeyDownCapture={(event) => {
          if (event.key !== "Enter" || event.shiftKey || disabled) return;
          event.preventDefault();
          event.currentTarget.closest("form")?.requestSubmit();
        }}
        className="mathlive-host min-h-14 w-full min-w-0 overflow-x-auto rounded-lg border border-line bg-paper/60 px-3 py-2 focus-within:border-forge focus-within:bg-white focus-within:ring-2 focus-within:ring-forge/15"
      />
      <div className="mt-1 flex min-h-11 items-center justify-between gap-3 px-1">
        {!ready ? <p role="status" className="py-2 text-sm text-muted">Loading maths input…</p> : null}
        {ready && !keyboardVisible ? (
          <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-forge hover:bg-forge-soft" aria-expanded="false" aria-controls="stemforge-math-keyboard" onClick={() => setKeyboardVisible(true)}>
            Show maths keyboard
          </button>
        ) : null}
        {ready && keyboardVisible ? <p className="text-sm font-extrabold text-ink">Maths keyboard</p> : null}
      </div>
      {ready && keyboardVisible ? (
        <div id="stemforge-math-keyboard" data-testid="maths-keyboard" role="group" aria-label="Maths keyboard" className="mt-1 grid max-h-[min(52dvh,460px)] gap-3 overflow-y-auto overscroll-contain border-t border-line bg-paper/70 px-1 pb-1 pt-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,.85fr)] lg:overflow-visible">
          <KeyboardGroup id="basic" label="Basic" className="grid-cols-[minmax(0,3fr)_minmax(0,2fr)] max-[340px]:grid-cols-1">
            <div className="grid grid-cols-3 gap-1.5">
              {capabilities.numericLiterals ? ["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((key) => (
                <Key key={key} label={key} onClick={() => insert(key)} />
              )) : null}
              {capabilities.numericLiterals ? <span aria-hidden="true" /> : null}
              {capabilities.numericLiterals ? <Key label="0" onClick={() => insert("0")} /> : null}
            </div>
            <div className="grid grid-cols-2 content-start gap-1.5 max-[340px]:grid-cols-3">
              {capabilities.variable ? <Key label="x" onClick={() => insert("x")} /> : null}
              {capabilities.additionSubtraction ? <Key label="+" onClick={() => insert("+")} /> : null}
              {capabilities.additionSubtraction ? <Key label="−" accessibleLabel="Minus" onClick={() => insert("-")} /> : null}
              {capabilities.multiplication ? <Key label="×" accessibleLabel="Multiply" onClick={() => insert("\\cdot ")} /> : null}
              {capabilities.brackets ? <Key label="(" onClick={() => insert("(")} /> : null}
              {capabilities.brackets ? <Key label=")" onClick={() => insert(")")} /> : null}
            </div>
          </KeyboardGroup>

          <KeyboardGroup id="structures" label="Structures" className="grid-cols-4 max-sm:grid-cols-3">
            {capabilities.nonNegativeIntegerPowers ? <Key tier="structure" label="xⁿ" accessibleLabel="Power" onClick={() => insert("^{#0}")} /> : null}
            {capabilities.negativeIntegerPowers ? <Key tier="structure" label="x⁻ⁿ" accessibleLabel="Negative power" onClick={() => insert("^{-#0}")} /> : null}
            {capabilities.halfPowers ? <Key tier="structure" label="x⁻¹⁄²" accessibleLabel="Negative half power" onClick={() => insert("^{-\\frac{1}{2}}")}/> : null}
            {capabilities.numericFractions || capabilities.elementaryFractions ? <Key tier="structure" label="a⁄b" accessibleLabel="Fraction" onClick={() => insert("\\frac{#0}{#?}")} /> : null}
            {capabilities.directSquareRoots ? <Key tier="structure" label="√x" accessibleLabel="Insert square root" onClick={() => insert("\\sqrt{#0}")} /> : null}
            {capabilities.boundedReciprocalSquareRoots ? <Key tier="structure" label="1⁄√x" accessibleLabel="Reciprocal square root" onClick={() => insert("\\frac{1}{\\sqrt{#0}}")}/> : null}
          </KeyboardGroup>

          {hasFunctions ? (
            <KeyboardGroup id="functions" label="Functions & constants" className="grid-cols-7 max-sm:grid-cols-4 lg:col-span-2">
              {elementaryControls.map((control) => <Key tier="structure" key={control.id} label={control.label} accessibleLabel={control.accessibleLabel} onClick={() => insert(control.latex)} />)}
            </KeyboardGroup>
          ) : null}

          <KeyboardGroup id="editing" label="Editing" className="grid-cols-6 max-sm:grid-cols-3 lg:col-span-2">
            <Key tier="utility" label="←" accessibleLabel="Move left" onClick={() => command("moveToPreviousChar")} />
            <Key tier="utility" label="→" accessibleLabel="Move right" onClick={() => command("moveToNextChar")} />
            <Key tier="utility" label="⌫" accessibleLabel="Backspace" onClick={() => command("deleteBackward")} />
            <Key tier="utility" label="Undo" onClick={() => command("undo")} />
            <Key tier="utility" label="Redo" onClick={() => command("redo")} />
            <Key tier="utility" label="Hide" accessibleLabel="Hide maths keyboard" onClick={() => setKeyboardVisible(false)} />
          </KeyboardGroup>
        </div>
      ) : null}
    </div>
  );
}

function KeyboardGroup({ id, label, className, children }: { id: string; label: string; className: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`maths-keyboard-${id}`} data-testid={`maths-keyboard-group-${id}`} className="min-w-0">
      <h3 id={`maths-keyboard-${id}`} className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</h3>
      <div className={`grid gap-1.5 ${className}`}>{children}</div>
    </section>
  );
}

function Key({ label, accessibleLabel, onClick, tier = "normal" }: { label: string; accessibleLabel?: string; onClick: () => void; tier?: "normal" | "structure" | "utility" }) {
  const tierClass = tier === "structure"
    ? "border-forge/25 bg-forge-soft text-forge hover:border-forge"
    : tier === "utility"
      ? "border-transparent bg-white/50 text-muted hover:border-line hover:bg-white hover:text-ink"
      : "border-line bg-white text-ink hover:border-forge";
  return <button type="button" aria-label={accessibleLabel} data-key-tier={tier} className={`min-h-11 min-w-11 rounded-lg border px-2 text-sm font-bold transition ${tierClass}`} onClick={onClick}>{label}</button>;
}
