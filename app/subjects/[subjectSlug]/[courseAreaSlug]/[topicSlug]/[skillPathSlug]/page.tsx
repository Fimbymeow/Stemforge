import { notFound } from "next/navigation";
import { SkillPathLearningPage } from "@/components/subject-learning-pages";
import { getSkillPathContextByRoute } from "@/lib/learning-paths";

export default async function CanonicalSkillPathPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; courseAreaSlug: string; topicSlug: string; skillPathSlug: string }>;
}) {
  const { subjectSlug, courseAreaSlug, topicSlug, skillPathSlug } = await params;
  const context = getSkillPathContextByRoute(subjectSlug, courseAreaSlug, topicSlug, skillPathSlug);
  if (!context?.skillPath.isAvailable) notFound();
  return (
    <SkillPathLearningPage
      subjectSlug={subjectSlug}
      courseAreaSlug={courseAreaSlug}
      specAreaSlug={topicSlug}
      skillPathSlug={skillPathSlug}
    />
  );
}
