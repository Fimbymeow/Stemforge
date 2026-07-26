import { notFound } from "next/navigation";
import { QuestionBank } from "@/components/question-bank";
import { getSubjectBySlug } from "@/lib/learning-paths";

export default async function CanonicalQuestionBankPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;
  if (!getSubjectBySlug(subjectSlug)) notFound();
  return <QuestionBank subjectSlug={subjectSlug} />;
}
