import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";

export const courseCatalog = [
  {
    slug: higherMaths.subjectSlug,
    name: higherMaths.subjectName,
    level: higherMaths.level,
    subject: higherMaths.subject,
    status: "Available Now",
    description: higherMaths.description,
    longDescription: higherMaths.longDescription,
    href: higherMaths.href,
    available: true,
    topicCount: higherMaths.topicCount,
    progress: higherMaths.progress,
    questionsCompleted: higherMaths.questionsCompleted,
  },
  {
    slug: higherPhysics.subjectSlug,
    name: higherPhysics.subjectName,
    level: higherPhysics.level,
    subject: higherPhysics.subject,
    status: "Coming Soon",
    description: "Structured SQA Higher Physics learning paths are being prepared.",
    longDescription: higherPhysics.longDescription,
    href: higherPhysics.href,
    available: false,
    topicCount: higherPhysics.topicCount,
    progress: 0,
    questionsCompleted: 0,
  },
] as const;

export const subjectCatalog = courseCatalog;

export const higherMathsSubject = courseCatalog[0];
export const higherPhysicsSubject = courseCatalog[1];

export const subjectRoadmap = subjectCatalog.map((subject) => subject.name);

