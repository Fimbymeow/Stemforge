# STEM Forge Progress and Mastery Rules

Source: approved product model supplied for Sprint 5. The attached PDF remains the original product artifact; this repository copy records the implemented MVP rules.

## Core distinction

- **Attempted:** at least one non-empty submitted answer.
- **Completed:** answered correctly, or the full worked solution was deliberately viewed after a genuine attempt.
- **Correct:** the latest genuine submitted attempt is correct.
- **Mastery:** stage/path evidence derived from the strongest demonstrated outcomes, not completion alone.

## Support and outcomes

- Empty input, opening a hint, opening a solution, navigating, or typing without submitting is not a genuine attempt.
- A hint does not block completion. Correct after a hint is recorded as `correct_with_hint`.
- A worked solution is available only after a genuine attempt. Deliberately viewing it completes the question and recommends review.
- Attempt history is append-oriented. A later weaker result does not erase stronger prior evidence.

## Mastery contributions

| Best demonstrated outcome | Contribution |
|---|---:|
| Independent correct, first attempt | 1.00 |
| Independent correct after error | 0.85 |
| Correct after hint | 0.70 |
| Completed with worked solution | 0.35 |
| Attempted, unresolved | 0.10 |
| Not attempted | 0.00 |

Legacy V1 evidence with unknown support receives conservative internal outcomes and never claims independent performance.

## Stage and path rules

Progress bars measure completed active questions only. Stage mastery is the mean question contribution. Path mastery weights stages: Foundations 25%, Applications 35%, Past Paper-style Questions 40%; missing stage weights are redistributed proportionally.

- **Not started:** no genuine attempt and no completion.
- **In progress:** activity exists but required questions are not all complete.
- **Completed:** all required questions complete.
- **Secure:** complete and mastery is at least 75%.
- **Mastered stage:** complete, mastery at least 90%, and at least 70% correct without a worked solution.
- **Mastered path:** complete, weighted mastery at least 90%, at least 70% correct without a worked solution, and Past Paper-style mastery at least 80% where present.

Correct-with-hint counts toward the “without worked solution” condition because the approved wording tests solution independence, while its lower contribution still prevents hint-heavy work from easily reaching 90% mastery.

## Accuracy and review

First-attempt accuracy counts each attempted question once and is the proportion whose first genuine attempt was correct. Latest-attempt accuracy uses the latest genuine submitted result. Neither metric is mastery.

Review is recommended for solution-assisted completion, repeated incorrect answers, hint-assisted correctness, legacy-ambiguous evidence, or a later incorrect answer after stronger correctness evidence. Time decay is deferred.

## Migration and content changes

V1 and unversioned records are retained in V2. Their old visible completion is preserved through `legacyCompleted`, but support independence is `unknown_legacy`. Removed questions remain in history and stop affecting current totals. New active questions enter current denominators. Content-version infrastructure is deferred.
