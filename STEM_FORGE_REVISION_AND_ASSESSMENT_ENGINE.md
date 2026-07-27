# STEM Forge Revision and Assessment Engine

Sprint 20 added the generic local practice-session engine around the canonical question system. The Practice Session Programme now defines its production interaction and persistence contract.

## Model

Practice sessions use schema v2 under the backwards-compatible `stemforge.practiceSessions.v1` key. A session stores an explicit origin, one `subjectId`, optional `parentSessionId`, course/path filters, pinned question references, current index, timing, selection metadata and live/final skipped IDs. It does not store answer keys, full question content, sampled graph arrays, credentials or account identifiers. V1 stores migrate in memory and ordinary reads remain read-only; an explicit activation or save persists repaired v2 state.

Question references pin subject, course, path, stage, question ID, question version and content revision. If a referenced question later becomes unavailable or changes version/revision, the session fails safely instead of silently substituting a different question.

## Eligibility and selection

`lib/practice/practice-eligibility.ts` discovers eligible questions through the canonical content resolver. `lib/practice/practice-selection.ts` builds deterministic sessions for:

- targeted practice;
- mixed practice from available content;
- needs-work practice;
- retry-incorrect practice.

Selection uses a deterministic seed and never calls `Math.random()` for session construction. It never pads sparse banks with duplicates or fake questions.

## Modes

Targeted practice focuses on selected available paths. Mixed practice balances across available path pools. Needs-work uses existing canonical progress signals: review recommendations, attempted-but-incomplete questions and current-version evidence. Retry-incorrect uses the latest current-version genuine attempt; a later correct attempt removes a question from retry eligibility.

## Timing

Timed sessions are optional for targeted and mixed sessions. Expiry completes the session and shows a summary. It does not submit blank answers, change marking, or mutate mastery.

## Question workspace integration

Each question renders and submits through `QuestionWorkspace`, `QuestionAnswerInput`, `markQuestionAnswer` and `saveQuestionAttempt`. A single typed session configuration passes only the session ID, owned panel, return path, lock state, current guided self-check and evidence callback. Standalone routes omit that object and retain their original footer, draft, marking and support behaviour. Graph and nature-table questions use the same Sprint 19 structured answer path.

## Origins, activation and navigation

Origins are explicit: Question Bank custom, subject review, Quick Practice, configured setup, Working Context, retry incorrect and retry skipped. Runtime labels and subject-generic return destinations use `origin` and `subjectId`; selection seeds never infer UI identity.

Every producer calls the central activation boundary. It validates candidates in memory, reloads and repairs the latest store under the shared browser Web Lock or IndexedDB lease, then activates, resumes, replaces or cancels. Replace abandons the old session. Cancel never persists the candidate. Pointer changes fail closed, and a persisted store contains at most one active session. This coordination reduces compliant-tab races but does not make LocalStorage transactional.

Active chrome keeps Previous, reversible Skip, Next and Finish visible. Next never creates Skip and remains usable around unavailable questions. The `Question N of M` trigger opens one focus-trapped, internally scrolling question list; unavailable rows remain visible but disabled. There is no persistent navigator rail and no Flag state.

## Skip, guided self-check and completion

Skip is local session state, not a failed attempt. Only the explicit control adds it; Undo removes it; a genuine attempt or guided self-assessment clears it; drafts do not. Unavailable questions cannot be skipped. Completion freezes the live set into `finalSkippedQuestionIds`, clears the active pointer and is idempotent under the same coordination boundary.

Written and multi-step questions inside a session offer Confident, Unsure and Needs review only after a genuine attempt. Each change appends a new V5 guided self-assessment event with the real session ID. Latest outcome is derived. It is never correctness and does not change mastery, review scheduling or correctness percentages.

Finish completes immediately when no unresolved state remains. Otherwise the focus-trapped confirmation reports non-zero unanswered, skipped, unavailable and awaiting-self-check counts and can return to practice, open the existing question list or finish.

## Persistence and sync boundary

Session UI state remains local browser state only; sessions do not sync across devices. Submitted attempts/support events carry an optional `practiceSessionId` only when written from a session. Canonical V5 evidence and guided self-assessments continue through import, sync, provenance, export and account erasure.

## Summary

One pure status derivation powers the question list, Finish confirmation and summary. Exact session IDs take precedence; older records without an ID use the bounded session timestamp fallback and records carrying another session ID are never counted through that fallback. The summary separates auto-marked correctness from guided confidence, and reports unanswered, skipped, unavailable and support use. Worth revisiting is derived from latest incorrect, multiple attempts, support use, Unsure/Needs review or final Skip. Retry incorrect and retry skipped create subject-scoped child sessions with explicit origins and parent linkage, then use central activation.

## Future content

Correctly registered canonical content becomes eligible automatically when active, resolvable and supported by the existing renderer/answer engine. Synthetic tests prove new paths, archived exclusions, retry/needs-work evidence and graph question adoption without changing selection logic.

## Limits

This is not full-course revision, a mock SQA paper engine, adaptive difficulty, spaced repetition, AI recommendation, analytics, XP/streaks, teacher workflow or content-authoring pipeline.
