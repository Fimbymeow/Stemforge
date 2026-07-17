# STEM Forge Evidence-Driven Dashboard

Sprint 18 replaces the previous single-path local-progress dashboard with a learner home derived from canonical progress evidence and active content structure.

## Source of truth

Dashboard meaning is owned by `lib/dashboard-derivations.ts`.

The React dashboard must not independently decide:

- what the next learner action is;
- whether a path needs reinforcement;
- whether evidence is secure or mastered;
- how recent activity is grouped;
- how local/account sync status should be summarized.

Client components may read local browser evidence and sync provider state, then pass those inputs into the derivation layer. The derivation layer remains pure and testable.

## Current learner home sections

`/dashboard` now shows:

- a primary continue/start/strengthen/review recommendation;
- available Higher Maths progress across active course evidence;
- stage coverage for the available path structure;
- grouped recent activity;
- seven-day activity summary based on genuine attempts and achievement snapshots;
- needs-work prompts from incomplete or review-recommended evidence;
- current secure/mastered evidence and retained historical path snapshots;
- conservative local/account sync status;
- quick links to the question bank and resources.

## Private-beta boundaries

The dashboard remains local-first and credential-free for ordinary builds. It does not require accounts, Supabase, analytics, payments, AI recommendations, notifications or new content.

Authenticated sync can improve the status line, but guest learning remains fully available. The ordinary Playwright suite still forces auth off; auth-enabled rendering remains separately verified.

## Evidence rules

The dashboard uses current progress and mastery calculations from `lib/progress/calculations.ts`.

- Completion uses completed current questions, not raw attempts.
- Needs-work does not invent weakness without evidence.
- Secure/mastered status is recalculated from current content where possible.
- Historical immutable snapshots may be displayed as historical achievements, but they do not override current-version readiness.
- Support-only events do not count as active learning days unless represented by genuine attempts or achievement snapshots.

## Verification

Focused coverage lives in:

- `tests/dashboard-derivations.test.ts`
- `e2e/dashboard.spec.ts`
- mobile dashboard assertions in `e2e/mobile.spec.ts`
- auth-enabled hydration coverage in `e2e/auth-enabled-navigation.spec.ts`

The complete safe gate remains:

```bash
pnpm run typecheck
pnpm run lint
pnpm run validate-content
pnpm test
pnpm run test:database
pnpm run test:e2e
pnpm build
git diff --check
```
