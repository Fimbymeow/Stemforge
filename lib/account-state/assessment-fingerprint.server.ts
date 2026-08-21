import "server-only";

import { createHash } from "node:crypto";
import { stableStringify } from "@/lib/progress/event-identity";
import type { Assessment } from "@/lib/study-plan/types";

export function assessmentContentFingerprint(assessment: Assessment) {
  const canonical = {
    courseSlug: assessment.courseSlug.trim().toLowerCase(),
    type: assessment.type,
    title: assessment.title.trim().replace(/\s+/g, " ").toLowerCase(),
    date: assessment.date,
    scope: assessment.scope.kind === "whole_course" ? assessment.scope : assessment.scope.kind === "topics"
      ? { kind: "topics", topicIds: [...assessment.scope.topicIds].sort() }
      : { kind: "skills", skillPathIds: [...assessment.scope.skillPathIds].sort() },
  };
  return createHash("sha256").update(stableStringify(canonical), "utf8").digest("hex");
}
