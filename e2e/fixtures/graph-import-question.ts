import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalContent } from "@/data/canonical-content";
import type { Question, Subject } from "@/data/types";
import { reconstructPreviewDecisionPayload } from "@/lib/content-import/preview";

export const GRAPH_IMPORT_PILOT_QUESTION_ID = "hm-calc-area-curve-a-001";
export const GRAPH_IMPORT_PILOT_PRACTICE_SESSION_ID = "__e2e-graph-import-pilot";
const PILOT_STAGE_ID = "pilot-area-applications";
const SOURCE_PATH = "content-drafts/higher-maths/calculus/area-under-curve-graph-pilot-v1.md";
const CONFIGURATION_PATH = "isolated-preview/area-under-curve-graph-pilot-v1.import.json";

export function createGraphImportPilotPreview() {
  const sourceBytes = readFileSync(resolve(process.cwd(), SOURCE_PATH));
  const configurationBytes = Buffer.from(JSON.stringify({
    bankId: "area-under-curve",
    sourceBankVersion: "1",
    targetSkillPathSlug: "area-under-curve",
    stageNameToStageId: { Applications: PILOT_STAGE_ID },
    runMode: "new_content_only",
  }));
  return reconstructPreviewDecisionPayload({
    sourcePath: SOURCE_PATH,
    sourceBytes,
    configurationPath: CONFIGURATION_PATH,
    configurationBytes,
    subjects: subjectsWithIsolatedPilotStage(),
    questions: canonicalContent.questions,
  });
}

export function createGraphImportPilotQuestion(): Question {
  const result = createGraphImportPilotPreview().payload.classifications[0];
  if (!result?.canonicalQuestion || result.blockers.length) {
    throw new Error(`Graph import pilot is not previewable: ${result?.blockers.map((item) => item.code).join(",") || "missing classification"}`);
  }
  return result.canonicalQuestion;
}

function subjectsWithIsolatedPilotStage(): Subject[] {
  const subjects = structuredClone(canonicalContent.subjects) as Subject[];
  for (const subject of subjects) for (const course of subject.courseAreas) for (const area of course.specAreas) {
    const path = area.skillPaths?.find((candidate) => candidate.slug === "area-under-curve");
    if (!path) continue;
    path.learningStages = [{
      id: PILOT_STAGE_ID,
      stageVersion: 1,
      contentStatus: "active",
      title: "Applications",
      label: "Applications",
      name: "Applications",
      description: "Isolated graph-import preview stage.",
      questionIds: [GRAPH_IMPORT_PILOT_QUESTION_ID],
      questions: 1,
      completed: 0,
      button: "Start",
      accent: "blue",
      status: "available",
      estimatedMinutes: 5,
    }];
    return subjects;
  }
  throw new Error("Graph pilot target path is absent from the canonical registry.");
}
