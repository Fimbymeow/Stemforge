import { PracticeSetup } from "@/components/practice/practice-setup";
import { parseWorkingContextPathId } from "@/lib/working-context";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const path = Array.isArray(query.path) ? query.path[0] : query.path;
  return <PracticeSetup workingContextPathId={parseWorkingContextPathId(path)} />;
}
