import { notFound } from "next/navigation";
import { SpecAreaLearningPathPage } from "@/components/subject-learning-pages";
import { getCourseAreaBySlug, getSubjectBySlug, getTopicBySlug } from "@/lib/learning-paths";

export default async function CanonicalSpecAreaPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; courseAreaSlug: string; topicSlug: string }>;
}) {
  const { subjectSlug, courseAreaSlug, topicSlug } = await params;
  const subject = getSubjectBySlug(subjectSlug);
  const courseArea = getCourseAreaBySlug(subject, courseAreaSlug);
  if (!getTopicBySlug(courseArea, topicSlug)) notFound();
  return (
    <SpecAreaLearningPathPage
      subjectSlug={subjectSlug}
      courseAreaSlug={courseAreaSlug}
      specAreaSlug={topicSlug}
    />
  );
}
