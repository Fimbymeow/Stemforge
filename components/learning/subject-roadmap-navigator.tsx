"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { IconNodePath } from "@/components/learning/icon-node-path";
import { TopicRoadmap } from "@/components/learning/topic-roadmap";
import type { CourseArea, Subject, Topic } from "@/data/types";

type Level = "unit" | "spec" | "topics";

function defaultLevel(units: CourseArea[]): Level {
  if (units.length > 1) return "unit";
  if (units[0]?.specAreas[0]?.skillPaths?.some((path) => path.isAvailable)) return "topics";
  if ((units[0]?.specAreas.length ?? 0) > 1) return "spec";
  return "topics";
}

export function SubjectRoadmapNavigator({ subject }: { subject: Subject }) {
  const units = subject.courseAreas;
  const [unitIndex, setUnitIndex] = useState(0);
  const [specIndex, setSpecIndex] = useState(0);
  const [level, setLevel] = useState<Level>(() => defaultLevel(units));

  const unit = units[unitIndex];
  const specAreas: Topic[] = unit?.specAreas ?? [];
  const specArea = specAreas[specIndex];

  if (!unit || !specArea) return null;

  function selectUnit(index: number) {
    setUnitIndex(index);
    setSpecIndex(0);
    const nextUnit = units[index];
    setLevel((nextUnit?.specAreas.length ?? 0) > 1 ? "spec" : "topics");
  }

  function selectSpec(index: number) {
    setSpecIndex(index);
    setLevel("topics");
  }

  return (
    <section className="min-w-0 max-w-full">
      <h2 className="mb-2 text-lg font-extrabold">Roadmap</h2>
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Roadmap breadcrumb">
        <span className="font-bold text-ink">{subject.subjectName}</span>
        <span>/</span>
        {units.length > 1 ? (
          <button type="button" onClick={() => setLevel("unit")} className={`font-bold ${level === "unit" ? "text-forge" : "hover:text-forge"}`}>
            {unit.name}
          </button>
        ) : (
          <span className="font-bold">{unit.name}</span>
        )}
        {level !== "unit" ? (
          <>
            <span>/</span>
            {specAreas.length > 1 ? (
              <button type="button" onClick={() => setLevel("spec")} className={`font-bold ${level === "spec" ? "text-forge" : "hover:text-forge"}`}>
                {specArea.name}
              </button>
            ) : (
              <span className="font-bold">{specArea.name}</span>
            )}
          </>
        ) : null}
      </nav>

      <div key={level} className="animate-fade-rise">
        {level === "unit" ? (
          <Card className="min-w-0 overflow-hidden p-5">
            <IconNodePath
              items={units.map((item) => ({ id: item.slug, label: item.name, available: item.available }))}
              selectedIndex={unitIndex}
              onSelect={selectUnit}
            />
          </Card>
        ) : level === "spec" ? (
          <Card className="min-w-0 overflow-hidden p-5">
            <IconNodePath
              items={specAreas.map((item) => ({ id: item.slug, label: item.name, available: item.skillPaths?.some((path) => path.isAvailable) ?? false }))}
              selectedIndex={specIndex}
              onSelect={selectSpec}
            />
          </Card>
        ) : specArea.skillPaths?.length ? (
          <TopicRoadmap skillPaths={specArea.skillPaths} showHeading={false} />
        ) : (
          <p className="text-muted">More topics for {specArea.name} are being prepared.</p>
        )}
      </div>
    </section>
  );
}
