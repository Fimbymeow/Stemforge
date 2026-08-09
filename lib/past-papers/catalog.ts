import { pastPapers } from "@/data/past-papers";

export function getPastPapersForSubject(subjectSlug: string) {
  return pastPapers
    .filter((record) => record.subjectSlug === subjectSlug)
    .toSorted((left, right) => right.year - left.year || left.paperNumber - right.paperNumber);
}
