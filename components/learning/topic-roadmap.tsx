"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, FileText, Layers3, Sparkles, Target } from "lucide-react";
import { Card } from "@/components/ui";
import { IconNodePath } from "@/components/learning/icon-node-path";
import { getResourceHref } from "@/lib/learning-paths";
import type { SkillPath } from "@/data/types";

export function TopicRoadmap({ skillPaths, showHeading = true }: { skillPaths: SkillPath[]; showHeading?: boolean }) {
  const initialIndex = Math.max(
    skillPaths.findIndex((path) => path.isAvailable),
    0,
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const selected = skillPaths[selectedIndex];

  return (
    <section className="min-w-0 max-w-full">
      {showHeading ? (
        <>
          <h2 className="m-0 text-xl font-extrabold">Topic roadmap</h2>
          <p className="mt-2 text-muted">Differentiation is split into focused topics. Start with Basic differentiation.</p>
        </>
      ) : null}
      <Card className={`min-w-0 overflow-hidden p-5 ${showHeading ? "mt-4" : ""}`}>
        <IconNodePath
          items={skillPaths.map((path) => ({ id: path.slug, label: path.name, available: path.isAvailable }))}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />

        <div key={selected.slug} className="animate-fade-rise mt-5 border-t border-line pt-5">
          <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wide ${selected.isAvailable ? "bg-forge-soft text-forge" : "bg-[#f4f1eb] text-muted"}`}>
            {selected.isAvailable ? "Available now" : "Coming soon"}
          </span>
          <h3 className="m-0 text-lg font-extrabold">{selected.name}</h3>
          <p className="mt-1 max-w-[56ch] text-sm text-muted">{selected.description}</p>

          {selected.isAvailable ? (
            <div className="mt-4 grid grid-cols-5 gap-2.5 max-md:grid-cols-2">
              <RoadmapTile href={getResourceHref("revision-notes")} icon={<FileText className="size-4" />} label="Notes" />
              <RoadmapTile href={getResourceHref("formula-cards")} icon={<BookOpen className="size-4" />} label="Formula cards" />
              <RoadmapTile href={getResourceHref("worked-examples")} icon={<Sparkles className="size-4" />} label="Worked examples" />
              <RoadmapTile href={getResourceHref("flashcards")} icon={<Layers3 className="size-4" />} label="Flashcards" />
              <RoadmapTile href={selected.href} icon={<Target className="size-4" />} label="Practise" primary />
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f4f1eb] px-4 py-3 text-sm font-semibold text-muted">
              <Sparkles className="size-4 shrink-0" />
              Notes, formula cards, worked examples and flashcards for this topic are being prepared.
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

function RoadmapTile({ href, icon, label, primary }: { href: string; icon: ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center text-[11.5px] font-bold transition hover:-translate-y-0.5 ${
        primary ? "border-forge bg-forge text-white" : "border-line bg-white text-ink hover:border-forge"
      }`}
    >
      <span className={`grid size-8 place-items-center rounded-lg ${primary ? "bg-white/20 text-white" : "bg-forge-soft text-forge"}`}>{icon}</span>
      {label}
    </Link>
  );
}
