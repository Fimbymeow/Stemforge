"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type SkillPickerOption = { id: string; name: string };

export function filterSkillPickerOptions(options: readonly SkillPickerOption[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return normalizedQuery ? options.filter((item) => item.name.toLocaleLowerCase().includes(normalizedQuery)) : options;
}

export function SkillFilterPicker({ label, values, onClear, onToggle, options, allLabel, mobile }: { label: string; values: readonly string[]; onClear: () => void; onToggle: (id: string, checked: boolean) => void; options: readonly SkillPickerOption[]; allLabel: string; mobile: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchId = useId();
  const panelId = useId();
  const filteredOptions = useMemo(() => filterSkillPickerOptions(options, query), [options, query]);
  const summary = values.length ? `${values.length} skill${values.length === 1 ? "" : "s"} selected` : allLabel;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown, true);
    if (!mobile) document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (!mobile) document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobile, open]);

  return <div ref={rootRef} role="group" aria-label={label} className="relative grid gap-1">
    <span className="text-sm font-bold">{label}</span>
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={`${label}: ${summary}`}
      onClick={() => setOpen((current) => !current)}
      className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge"
    >
      <span className="truncate">{summary}</span><ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open ? <div id={panelId} className={`${mobile ? "mt-1" : "absolute left-0 right-0 top-full z-30 mt-1 shadow-lg"} grid gap-2 rounded-lg border border-line bg-white p-3`}>
      <label htmlFor={searchId} className="sr-only">Search skills</label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills" className="min-h-11 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm" />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
        <button type="button" onClick={onClear} className="min-h-10 text-forge">Select all valid skills</button>
        {values.length ? <button type="button" onClick={onClear} className="min-h-10 text-muted">Clear selected skills</button> : null}
      </div>
      <div className="grid max-h-52 gap-1 overflow-y-auto overscroll-contain border-t border-line pt-1" data-testid="skill-picker-options">
        {filteredOptions.length ? filteredOptions.map((item) => <label key={item.id} className="flex min-h-10 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={values.includes(item.id)} onChange={(event) => onToggle(item.id, event.target.checked)} /> {item.name}
        </label>) : <p className="py-3 text-sm text-muted">No skills match that search.</p>}
      </div>
      <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="min-h-10 justify-self-end px-2 text-sm font-bold text-forge">Done</button>
    </div> : null}
  </div>;
}
