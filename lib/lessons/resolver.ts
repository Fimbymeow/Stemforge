import type { SkillPath } from "@/data/types";
import { adaptLegacyResourcesToLessonDocument } from "@/lib/lessons/legacy-adapter";
import type { LessonDocumentSkillPath, LessonResolution } from "@/lib/lessons/types";

export function resolveLessonDocument(skillPath: SkillPath): LessonResolution | null {
  const native = (skillPath as LessonDocumentSkillPath).lessonDocument;
  if (native) return { document: native, source: "native" };
  const adapted = adaptLegacyResourcesToLessonDocument(skillPath);
  return adapted ? { document: adapted, source: "legacy_adapter" } : null;
}
