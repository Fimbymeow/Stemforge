"use client";

import { BookOpen } from "lucide-react";

export type IconNodeItem = { id: string; label: string; available: boolean };

export function IconNodePath({ items, selectedIndex, onSelect }: { items: IconNodeItem[]; selectedIndex: number; onSelect: (index: number) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex w-max min-w-full items-start justify-center px-1">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={index === selectedIndex}
              aria-current={index === selectedIndex ? "true" : undefined}
              data-selected={index === selectedIndex ? "true" : undefined}
              className="group flex min-h-11 w-[124px] flex-col items-center gap-1.5 border-none bg-transparent p-1 sm:w-[140px]"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full border transition duration-150 ease-out group-hover:-translate-y-0.5 ${
                  index === selectedIndex
                    ? "border-forge bg-forge-soft text-forge ring-2 ring-forge-soft"
                    : "border-forge-soft bg-forge-soft text-forge"
                }`}
                data-roadmap-node-icon
              >
                <BookOpen className="size-4" />
              </span>
              <span className={`text-center text-[11.5px] leading-tight ${index === selectedIndex ? "font-extrabold text-[#17466c]" : item.available ? "font-bold text-ink" : "font-bold text-muted"}`}>{item.label}</span>
            </button>
            {index < items.length - 1 ? <span className="mt-[22px] h-px w-6 shrink-0 bg-line sm:w-9" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
