import { notFound } from "next/navigation";
import { QuestionPage } from "@/components/question-page";
import { QuestionWorkspace } from "@/components/questions/question-workspace";
import { getMathsQuestionById, getAnyQuestionById } from "@/data/question-registry";

export default async function QuestionById({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ case?: string }>;
}) {
  const { id } = await params;
  if (id === "hm-calc-area-curve-a-001" && process.env.STEMFORGE_E2E_FIXTURES === "true") {
    const fixture = await import("@/e2e/fixtures/graph-import-question");
    return <QuestionWorkspace question={fixture.createGraphImportPilotQuestion()} persistenceMode="ephemeral" />;
  }
  if (id === "__e2e-elementary-expression" && process.env.STEMFORGE_E2E_FIXTURES === "true") {
    const fixture = await import("@/e2e/fixtures/elementary-expression-question");
    const requestedCase = (await searchParams).case;
    if (!fixture.isElementaryExpressionE2ECase(requestedCase)) notFound();
    return <QuestionWorkspace question={fixture.createElementaryExpressionE2EQuestion(requestedCase)} persistenceMode="ephemeral" />;
  }
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
