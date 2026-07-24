import { PracticeSession } from "@/components/practice/practice-session";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <PracticeSession sessionId={sessionId} />;
}
