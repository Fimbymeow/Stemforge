import { notFound } from "next/navigation";
import { PastPapersLibrary } from "@/components/past-papers/past-papers-library";
import { getPastPapersForSubject } from "@/lib/past-papers/catalog";

export default async function SubjectPastPapersPage({ params }: { params: Promise<{ subjectSlug: string }> }) {
  const { subjectSlug } = await params;
  const records = getPastPapersForSubject(subjectSlug);
  if (records.length === 0) notFound();
  return <PastPapersLibrary records={records} />;
}
