import { getDemoSkill, demoNavigation } from "@/lib/demo/content";
import { WALKTHROUGH_IDS } from "@/lib/demo/walkthrough";
import { resolveLessonDocument } from "@/lib/lessons/resolver";
import { LessonRenderer } from "@/components/learning/lesson-renderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DemoNotes() {
  const skill = getDemoSkill()?.skillPath;
  const lesson = skill ? resolveLessonDocument(skill) : null;
  return lesson ? <div className="mx-auto grid min-w-0 max-w-[1100px] gap-6">
    <Link className="orthic-secondary-link inline-flex min-h-11 w-fit items-center gap-2 text-sm text-secondary" href={demoNavigation.skill}><ArrowLeft aria-hidden="true" className="size-4" />Back to Chain Rule</Link>
    <LessonRenderer document={lesson.document} continuation={{ href: demoNavigation.question(WALKTHROUGH_IDS[0]) ?? demoNavigation.skill, label: "Try Foundations" }} />
    </div>
    : <p>Chain Rule Notes are unavailable.</p>;
}
