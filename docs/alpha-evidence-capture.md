# Alpha Evidence Capture

Extends `docs/private-beta-checklist.md`'s existing "Session record" and `docs/private-beta-feedback-template.md`'s existing "Facilitator classification" block rather than replacing them. No analytics schema, no tracking platform, no passive collection — every field here is filled by a facilitator watching a real session, or transcribes a learner's own words.

## Per-task sheet (one copy per task card)

```text
Session: A / B / C     Task: ____   Hypothesis: ____
Session ID: ____       Device/browser: ____    Guest / Authenticated: ____
Assistance required: Y / N — if Y, exact intervention: ______________________

OBSERVED BEHAVIOUR:
  ________________________________________________________________

LEARNER QUOTE / PARAPHRASE (mark which):  [ ] quote   [ ] paraphrase
  "________________________________________________________________"

FACILITATOR INTERPRETATION (kept separate from the above):
  ________________________________________________________________

TYPE:  [ ] technical failure  [ ] product-comprehension  [ ] content/maths  [ ] preference
SEVERITY:  Critical / High / Medium / Low / preference
FREQUENCY: this session only  /  seen before (cite: ________)
```

The four fields — observed behaviour, learner quotation/paraphrase, facilitator interpretation, and finding type — are kept in four visibly separate places on purpose. Do not merge them; the severity rubric in `STEM_FORGE_ALPHA_READINESS.md` §5 depends on being able to tell "the product did something wrong" apart from "the learner misread something the product did correctly."

## Compact multi-task sheet

One row per task, for a facilitator tracking a whole session at speed. Expand any single row to the full per-task sheet above the moment a Medium-or-above finding occurs.

| Task | Assist? | Observed | Type | Severity |
|---|---|---|---|---|
| A1 | | | | |
| A2 | | | | |
| A3 | | | | |
| A4 | | | | |
| A5 | | | | |
| A6 | | | | |
| A7 | | | | |
| A8 | | | | |

Duplicate the same row shape for B1–B7 (`docs/alpha-session-b.md`) and C1–C5 (`docs/alpha-session-c.md`).

## Relationship to the in-app feedback mechanism

This sheet is the facilitator's own parallel record, deliberately independent of the in-app beta report mechanism (`docs/private-beta-operations-runbook.md`) — session evidence must never be lost to a server-side reporting hiccup. A learner's own in-app submission (Session A, task A8, hypothesis H10) is additional evidence, not a replacement for this sheet.
