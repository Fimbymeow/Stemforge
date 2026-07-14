# STEM Forge Conversation Handoff

Last updated: 14 July 2026
Current checkpoint: Sprint 10 private-beta readiness

This is the durable starting point for a new Codex conversation. Inspect the repository before editing. Preserve unfamiliar Finlay, Claude, or Codex changes and never reset a dirty tree without explicit approval.

## Product vision

STEM Forge is a structured Scottish SQA STEM learning platform, not a random question bank. Its learning loop is:

**Learn -> Practise -> Exam Questions -> Master**

The canonical hierarchy is Subject -> Course -> Skill Path -> Stage -> Question. Stages are Foundations, Applications, and Past Paper-style Questions.

The only active learner-ready vertical slice is:

**Higher Maths -> Calculus -> Differentiation -> Basic differentiation**

It contains eight active canonical questions in a 3/3/2 stage structure. Higher Physics is a separate locked/read-only legacy demonstration and has not been migrated. Other visible paths and subjects are coming soon, not available practice.

The approved visual baseline uses warm off-white backgrounds, white cards, subtle borders/shadows, and muted blue as the main application accent. Orange is supporting brand colour only.

## Private-beta position

The product is browser-local and needs no account or network after the application is loaded. Progress is saved on the current browser only. The private-beta package is in `docs/private-beta-checklist.md`, the reusable feedback questions are in `docs/private-beta-feedback-template.md`, and readiness evidence is in `STEM_FORGE_PRIVATE_BETA_READINESS.md`.

No authentication or database was added in Sprint 10. Accounts, remote persistence, and sync are permitted future roadmap work, but only through a separately approved sprint after beta evidence justifies them.

## Current progress source of truth

The LocalStorage key remains `stemforge.localProgress.v1`. Canonical writes use V4:

```ts
{
  version: 4,
  data: {
    attempts: QuestionAttempt[],
    supportEvents: QuestionSupportEvent[],
    achievementSnapshots: AchievementSnapshot[]
  }
}
```

- Attempts and support events are append-oriented evidence with explicit stable event IDs.
- New IDs use platform UUIDs through an injectable factory.
- V3/V2/V1/unversioned records receive deterministic migration IDs derived from retained content and original position.
- Unknown legacy question versions remain explicitly unknown.
- Structural snapshots are immutable stage/path Completed, Secure, and Mastered events carrying canonical structural versions.
- Migration never invents structural snapshots.
- Path reset clears current attempts/support events for that path and preserves snapshots.
- Current readiness is always recalculated from active content, current question versions, and current-version evidence.

Read `STEM_FORGE_STRUCTURAL_ACHIEVEMENTS_AND_MERGING.md`, `STEM_FORGE_PROGRESS_ARCHITECTURE.md`, and `STEM_FORGE_VERSION_AWARE_PROGRESS.md` before changing this boundary.

## Deterministic evidence merging

`mergeProgressEvidence` unions V4 attempts, support events, and snapshots. Exact equal IDs deduplicate; different IDs remain distinct. Same-ID conflicts are reported and resolved with an order-independent canonical representation. Output ordering is timestamp then event ID within each evidence type.

Focused tests establish immutable, idempotent, commutative, and associative payload merging. Unsupported future payloads are refused rather than downgraded. Merge remains pure and has no LocalStorage, React, network, account, or database dependency.

## Protected product contracts

- Answer acceptance/rejection and normalized exact-string Maths comparison must not change casually.
- Do not introduce mathematical equivalence checking.
- Empty input is not a genuine attempt; incorrect-only input does not complete a new question.
- Completion, mastery, accuracy, support, review, and acknowledgement are separate concepts.
- Hint use is supportive. Worked-solution completion creates review evidence.
- Mastery weights and thresholds are fixed by `STEM_FORGE_PROGRESS_AND_MASTERY_RULES.md`.
- Later weaker activity cannot erase stronger evidence.
- Snapshots preserve history but never determine current readiness.
- `stemforge.pathCelebration.v1` is UI acknowledgement only and remains separate from progress truth.
- Unsupported future storage must not be overwritten.
- Active/archive filtering stays centralized in `lib/content-selectors.ts`.
- Local-only learning, reduced motion, keyboard access, mobile usability, and the blue accent must remain.
- Do not delete historical progress or migrate legacy Physics.

## Content and answer boundaries

Canonical Higher Maths content has stable logical IDs, positive question/stage/path versions, content revisions, and active/archive lifecycle. Validation protects duplicates, hierarchy relationships, answers, lifecycle, and version invariants. Eight canonical Maths questions are active. Fifteen legacy Physics questions produce the one expected compatibility warning.

Question content is original SQA-style practice. Do not imply it is official, copied, affiliated with, or endorsed by SQA.

## Current verification baseline

Sprint 10 began from commit `d515ca2` and reproduced:

- frozen lockfile install: consistent/already up to date;
- TypeScript: passing;
- ESLint: passing;
- content validation: 0 errors, 1 expected legacy Physics warning;
- unit/integration tests: 124 passing;
- production build: passing, 22 routes;
- Playwright: 38 passing baseline tests with Chromium actually launched.

Sprint 10 adds three focused private-beta browser assertions, so the final expected browser total is 41 when the final matrix is green. Consult `STEM_FORGE_PRIVATE_BETA_READINESS.md` for the final exact result rather than relying on this expectation.

## Important routes

- `/`
- `/dashboard`
- `/subjects`
- `/subjects/higher-maths`
- `/subjects/higher-maths/calculus`
- `/subjects/higher-maths/calculus/differentiation`
- `/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- `/question/hm-calc-diff-basic-f-001`
- `/question/hm-calc-diff-basic-a-001`
- `/question/hm-calc-diff-basic-ppq-001`
- `/subjects/higher-physics` (locked/coming soon)
- `/resources`

## Remaining vertical-slice assumptions

These are known scaling preconditions, not Sprint 10 defects:

- global active subject/path constants select Higher Maths and Basic differentiation;
- shared lookup imports Higher Maths differentiation questions directly;
- question breadcrumbs and the subject badge assume Higher Maths/Calculus/Differentiation;
- some Higher Maths hub/resource links are fixed;
- question positioning is global across the Maths question set rather than fully path-scoped.

Do not perform a generic-routing rewrite until controlled multi-path import is the approved next sprint. Fix an assumption earlier only if it breaks the current beta journey.

## Intentional limitations

- No accounts, database, remote sync, distributed reset, analytics, payments, AI marking, CMS, or admin workflow.
- Progress and completion acknowledgement are local to one browser/device.
- No live feedback form/service; the facilitator supplies the Markdown feedback template.
- Chromium desktop/mobile are automated; Safari, Firefox, screen-reader, and public deployment audits remain owner/future checks.
- No multi-path authoring/import and no wider content bank has been added.
- Client clocks are untrusted; a future server may record trusted receive time separately.

## Verification commands

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run validate-content
pnpm test
pnpm run build
pnpm run test:e2e:desktop
pnpm run test:e2e:mobile
pnpm run test:e2e
pnpm run test:all
```

Do not weaken tests, add retries, or ignore application console errors to obtain a pass.

## Decision gate after private beta

Do not begin Sprint 11 without tester evidence.

- Choose remote evidence/database foundations if students value the journey and local-only/cross-device progress is the material blocker, with ownership/privacy/retention/reset requirements understood.
- Choose generic multi-path infrastructure and controlled content import if learners mainly need more material and the hardcoded vertical slice is the scaling blocker.
- Choose focused learner-experience correction if product purpose, navigation, input, status language, mobile, or accessibility is confusing or blocking.

The owner must first verify the public deployment is accessible without login/protection, record the tested build/commit, provide the feedback template to testers, and review the collected feedback against `STEM_FORGE_PRIVATE_BETA_READINESS.md`.
