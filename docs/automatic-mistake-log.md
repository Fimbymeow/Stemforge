# Automatic mistake-log design

Status: implemented as a version-safe read-side projection in Sprint 4B, connected to remediation in Sprint 4C and learner explanation in Sprint 4D.

## Evidence rule

An incorrect, genuine, graded attempt is automatic mistake evidence. Ungraded, malformed, guided-pending and synthetic events are not. The attempt remains in the append-only evidence history; the mistake log is a read-side projection and must not merge or delete evidence when it groups entries.

## Identity and grouping

The durable evidence identity is the attempt event ID. The learner-facing projection groups open evidence by question ID, question version and canonical skill ID. Multiple incorrect attempts at the same version remain separate source events but appear as one grouped item with attempt count and latest-attempt time.

A new question version is a new current-version group. Earlier-version evidence remains available as history and must not silently claim weakness against materially revised content.

## Open and resolved state

A group is open when it contains incorrect genuine graded evidence with no later qualifying resolution. It is resolved by either:

- a later independently correct attempt on the same current question version; or
- an independent-success Review event that explicitly covers that question version.

Resolution is derived from event order and provenance. It is not a destructive write and does not erase the original error.

## Relationship to Review

Open mistake evidence may feed the existing Review candidate derivation. A scheduled `Review due` state is separate: elapsed time can make a healthy, completed skill due for Review without creating a mistake. Review success can resolve mistake evidence only when it is independent and refers to the relevant question/version.

## Future learner classification

Optional classifications such as `Didn't know how`, `Forgot the method`, `Calculation error`, `Misread`, `Exam technique`, and `Ran out of time` require a separate evidence event and schema. They are not inferred and are not part of V1 automatic capture.
