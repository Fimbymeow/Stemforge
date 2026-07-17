# STEM Forge Revision and Assessment Engine

Sprint 20 adds a generic local practice-session engine around the canonical question system.

## Model

Practice sessions are versioned serialisable records stored under `stemforge.practiceSessions.v1`. A session stores mode, course/path filters, pinned question references, current index, timing state and selection metadata. It does not store answer keys, full question content, sampled graph arrays, credentials or account identifiers.

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

Each question renders and submits through `QuestionWorkspace`, `QuestionAnswerInput`, `markQuestionAnswer` and `saveQuestionAttempt`. Practice controls only session navigation, progress, timing and summary. Graph and nature-table questions use the same Sprint 19 structured answer path.

## Persistence and sync boundary

Session UI state is local browser state only. Submitted attempts remain canonical V4 progress evidence and continue through existing import/sync/account-erasure boundaries. Sprint 20 does not add remote session tables or cross-device session resume.

## Summary

`derivePracticeSessionSummary` derives attempted, correct, incorrect, unanswered, support-used, elapsed-time and path counts from the session references plus canonical progress evidence. Summaries do not mutate mastery.

## Future content

Correctly registered canonical content becomes eligible automatically when active, resolvable and supported by the existing renderer/answer engine. Synthetic tests prove new paths, archived exclusions, retry/needs-work evidence and graph question adoption without changing selection logic.

## Limits

This is not full-course revision, a mock SQA paper engine, adaptive difficulty, spaced repetition, AI recommendation, analytics, XP/streaks, teacher workflow or content-authoring pipeline.
