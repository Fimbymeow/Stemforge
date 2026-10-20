import { notFound, redirect } from "next/navigation";
import { CourseAreaPage } from "@/components/subject-learning-pages";
import { getHigherMathsCourseAreaHref } from "@/lib/course-area-navigation";
import { getCourseAreaBySlug, getSubjectBySlug } from "@/lib/learning-paths";

export default async function CanonicalCourseAreaPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; courseAreaSlug: string }>;
}) {
  const { subjectSlug, courseAreaSlug } = await params;
  const subject = getSubjectBySlug(subjectSlug);
  if (!getCourseAreaBySlug(subject, courseAreaSlug)) notFound();
  if (subjectSlug === "higher-maths") redirect(getHigherMathsCourseAreaHref(courseAreaSlug));
  return <CourseAreaPage subjectSlug={subjectSlug} courseAreaSlug={courseAreaSlug} />;
}
