import Link from "next/link";
import { getDemoQuestion, demoNavigation } from "@/lib/demo/content";
import { DemoQuestionWorkspace } from "@/components/demo/demo-question-workspace";

export default async function DemoQuestion({ params }: { params: Promise<{ id: string }> }) {
  const context = getDemoQuestion((await params).id);
  if (!context) return <section><h1 className="text-2xl font-semibold">Question unavailable in this demo</h1>
    <Link className="mt-4 inline-flex min-h-11 items-center underline" href={demoNavigation.skill}>Back to Chain Rule</Link></section>;
  return <DemoQuestionWorkspace key={context.question.id} question={context.question} />;
}
