import { HigherMathsResourceBrowser } from "@/components/higher-maths-resource-browser";

export default async function HigherMathsResourcePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return (
    <HigherMathsResourceBrowser
      returnTo={first(query.returnTo)}
      questionOrigin={{
        questionId: first(query.fromQuestion),
        questionNumber: first(query.questionNumber),
        token: first(query.originToken),
      }}
    />
  );
}
