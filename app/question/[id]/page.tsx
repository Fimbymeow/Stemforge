import { notFound } from "next/navigation";
import { QuestionPage } from "@/components/question-page";
import { QuestionWorkspace } from "@/components/questions/question-workspace";
import { getMathsQuestionById, getAnyQuestionById } from "@/data/question-registry";

export default async function QuestionById({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mathsQuestion = getMathsQuestionById(id);

  if (mathsQuestion) {
    return (
      <QuestionWorkspace question={mathsQuestion} />
    );
  }

  if (!getAnyQuestionById(id)) {
    notFound();
  }

  return <QuestionPage mode="demo" questionId={id} />;
}
