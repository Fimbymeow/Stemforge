import { notFound, redirect } from "next/navigation";
import { SpecAreaLearningPathPage } from "@/components/subject-learning-pages";
import { getHigherMathsCourseAreaHref } from "@/lib/course-area-navigation";
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
  if (subjectSlug === "higher-maths") redirect(getHigherMathsCourseAreaHref(courseAreaSlug));
  return (
    <SpecAreaLearningPathPage
      subjectSlug={subjectSlug}
      courseAreaSlug={courseAreaSlug}
      specAreaSlug={topicSlug}
    />
  );
}
