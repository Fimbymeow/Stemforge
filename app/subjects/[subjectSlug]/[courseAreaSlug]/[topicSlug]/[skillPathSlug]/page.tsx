import { notFound } from "next/navigation";
import { getSkillPathContextByRoute } from "@/lib/learning-paths";
import { WorkingContextOverview } from "@/components/working-context/working-context-overview";

export default async function CanonicalSkillPathPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; courseAreaSlug: string; topicSlug: string; skillPathSlug: string }>;
}) {
  const { subjectSlug, courseAreaSlug, topicSlug, skillPathSlug } = await params;
  const context = getSkillPathContextByRoute(subjectSlug, courseAreaSlug, topicSlug, skillPathSlug);
  if (!context?.skillPath.isAvailable) notFound();
  return <WorkingContextOverview pathId={context.skillPath.slug} />;
}
