import type { PracticeSession, PracticeSessionOrigin } from "@/lib/practice/practice-types";

const ORIGIN_LABELS: Record<PracticeSessionOrigin, string> = {
  question_bank_custom: "Custom practice",
  subject_review: "Review practice",
  quick_practice: "Quick Practice",
  configured_practice: "Configured practice",
  working_context_practice: "Current Path practice",
  retry_incorrect: "Retry incorrect",
  retry_skipped: "Retry skipped",
  scheduled_review: "Review",
};

export function practiceOriginLabel(origin: PracticeSessionOrigin) {
  return ORIGIN_LABELS[origin];
}

export function practiceReturnDestination(session: Pick<PracticeSession, "origin" | "subjectId">) {
  if (session.origin === "question_bank_custom" || session.origin === "subject_review") {
    return {
      href: `/subjects/${encodeURIComponent(session.subjectId)}/question-bank`,
      label: "Question Bank",
    };
  }
  if (session.origin === "scheduled_review") return { href: "/practice?review=1", label: "Review" };
  return { href: "/practice", label: "Practice" };
}

export function practiceSubjectDestination(subjectId: string) {
  return `/subjects/${encodeURIComponent(subjectId)}`;
}
