import { PracticeSession } from "@/components/practice/practice-session";
import { QuestionWorkspace } from "@/components/questions/question-workspace";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  if (sessionId === "__e2e-graph-import-pilot" && process.env.STEMFORGE_E2E_FIXTURES === "true") {
    const fixture = await import("@/e2e/fixtures/graph-import-question");
    return <QuestionWorkspace
      question={fixture.createGraphImportPilotQuestion()}
      persistenceMode="ephemeral"
      session={{
        practiceSessionId: sessionId,
        panel: <div className="rounded-xl border border-line bg-white p-4" data-testid="graph-import-practice-pilot"><strong>Practice session pilot</strong><p className="mt-1 text-sm text-muted">Imported graph question · Question 1 of 1</p></div>,
        answerLocked: false,
        returnHref: "/practice",
        currentSelfAssessment: null,
      }}
    />;
  }
  return <PracticeSession sessionId={sessionId} />;
}
