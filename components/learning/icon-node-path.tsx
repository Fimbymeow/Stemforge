"use client";

import { BookOpen } from "lucide-react";

export type IconNodeItem = { id: string; label: string; available: boolean };

export function IconNodePath({ items, selectedIndex, onSelect }: { items: IconNodeItem[]; selectedIndex: number; onSelect: (index: number) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max items-start px-1">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start">
            <button
              type="button"
              onClick={() => onSelect(index)}
              className="group flex w-[108px] flex-col items-center gap-2 border-none bg-transparent p-1 xl:w-[102px]"
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-forge-soft bg-forge-soft text-forge transition duration-150 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_14px_rgba(35,75,110,0.2)] ${
                  index === selectedIndex ? "ring-4 ring-forge-soft" : ""
                }`}
              >
                <BookOpen className="size-4" />
              </span>
              <span className={`text-center text-[11.5px] font-bold leading-tight ${item.available ? "text-ink" : "text-muted"}`}>{item.label}</span>
            </button>
            {index < items.length - 1 ? <span className="mt-[26px] h-0.5 w-8 shrink-0 bg-line xl:w-7" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
