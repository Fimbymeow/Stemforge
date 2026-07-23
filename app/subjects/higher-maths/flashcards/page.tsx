import { redirect } from "next/navigation";

export default async function HigherMathsResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  redirect(legacyResourceDestination((await searchParams).returnTo));
}

function legacyResourceDestination(returnTo: string | string[] | undefined) {
  const value = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null;
  return `/subjects/higher-maths/revision-notes${value ? `?returnTo=${encodeURIComponent(value)}` : ""}`;
}
