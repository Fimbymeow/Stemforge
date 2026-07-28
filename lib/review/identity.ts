import type { ReviewSourceRef, ReviewTargetRef } from "@/lib/review/types";

export async function createReviewEventId(source: ReviewSourceRef, target: ReviewTargetRef) {
  const bytes = new TextEncoder().encode(JSON.stringify([
    source.sourceType,
    source.sourceId,
    target.targetType,
    target.targetId,
  ]));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `review_${hex}`;
}
