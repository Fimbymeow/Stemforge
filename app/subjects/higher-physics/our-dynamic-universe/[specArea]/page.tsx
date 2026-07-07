import { notFound } from "next/navigation";
import { SpecAreaLearningPathPage } from "@/components/subject-learning-pages";
import { getHigherPhysicsSpecArea } from "@/data/higher-physics";

export default async function SpecAreaPage({ params }: { params: Promise<{ specArea: string }> }) {
  const { specArea } = await params;

  if (!getHigherPhysicsSpecArea("our-dynamic-universe", specArea)) {
    notFound();
  }

  return <SpecAreaLearningPathPage subjectSlug="higher-physics" courseAreaSlug="our-dynamic-universe" specAreaSlug={specArea} />;
}
