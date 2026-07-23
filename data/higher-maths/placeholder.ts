import {
  ACTIVE_CONTENT_STATUS,
  INITIAL_PATH_VERSION,
} from "@/data/content-metadata";
import type { SkillPath } from "@/data/types";

export function createHigherMathsPlaceholder({
  slug,
  specificationStrandId,
  displayOrder,
  name,
  description,
  parentHref,
}: {
  slug: string;
  specificationStrandId: string;
  displayOrder: number;
  name: string;
  description: string;
  parentHref: string;
}): SkillPath {
  return {
    slug,
    specificationStrandId,
    displayOrder,
    pathVersion: INITIAL_PATH_VERSION,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name,
    description,
    href: parentHref,
    status: "coming-soon",
    isAvailable: false,
    progress: 0,
    completed: 0,
    questions: 0,
    progressStatus: "locked",
  };
}
