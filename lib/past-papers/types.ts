export const PAST_PAPER_SOURCE_AUTHORITY = "Qualifications Scotland (formerly SQA)" as const;

export type PastPaperResource =
  | { status: "available"; url: string }
  | { status: "pending" | "unavailable"; note: string };

export type PastPaperRecord = {
  id: string;
  subjectSlug: string;
  qualification: "Higher";
  year: number;
  paperNumber: 1 | 2;
  officialTitle: string;
  calculatorPolicy: "non-calculator" | "calculator-permitted";
  paper: PastPaperResource;
  markingInstructions: PastPaperResource;
  sourceAuthority: typeof PAST_PAPER_SOURCE_AUTHORITY;
  sourceCheckedAt: string;
  note?: string;
};
