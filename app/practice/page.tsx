import { PracticeSetup } from "@/components/practice/practice-setup";
import { parseWorkingContextPathId } from "@/lib/working-context";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const path = Array.isArray(query.path) ? query.path[0] : query.path;
  const review = Array.isArray(query.review) ? query.review[0] : query.review;
  const workingContextPathId = parseWorkingContextPathId(path);
  return <PracticeSetup
    workingContextPathId={workingContextPathId}
    invalidWorkingContextPath={typeof path === "string" && path.length > 0 && !workingContextPathId}
    reviewMode={review === "1"}
  />;
}
