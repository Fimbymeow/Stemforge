"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { IconNodePath } from "@/components/learning/icon-node-path";
import { SubjectResourceLinks } from "@/components/learning/subject-resource-links";
import { getResourceHref, getSubjectForSkillPath } from "@/lib/learning-paths";
import { getSubjectFamily } from "@/lib/resource-capabilities";
import type { SkillPath } from "@/data/types";

export function TopicRoadmap({ skillPaths, showHeading = true }: { skillPaths: SkillPath[]; showHeading?: boolean }) {
  const initialIndex = Math.max(
    skillPaths.findIndex((path) => path.isAvailable),
    0,
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const selected = skillPaths[selectedIndex];
  const subject = getSubjectForSkillPath(selected);
  const subjectFamily = getSubjectFamily(subject?.subject ?? "Maths") ?? "mathematics";

  return (
    <section className="min-w-0 max-w-full">
      {showHeading ? (
        <>
          <h2 className="m-0 text-xl font-extrabold">Topic roadmap</h2>
          <p className="mt-2 text-muted">Explore the focused paths in this part of the Higher Maths course.</p>
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
            <div className="mt-4">
              <SubjectResourceLinks
                family={subjectFamily}
                variant="tiles"
                hrefs={{
                  notes: getResourceHref("revision-notes", subject?.subjectSlug),
                  flashcards: getResourceHref("flashcards", subject?.subjectSlug),
                  practice: "/practice",
                }}
              />
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f4f1eb] px-4 py-3 text-sm font-semibold text-muted">
              <Sparkles className="size-4 shrink-0" />
              This planned path has no published questions or learning resources yet.
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
