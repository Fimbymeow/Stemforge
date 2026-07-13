# STEM Forge Conversation Handoff

Last updated: 13 July 2026

This document is the starting point for a new Codex conversation. Read it before
making changes, then inspect the current code. The repository may contain user or
Claude frontend changes, so preserve existing work and never revert unfamiliar
changes without Finlay's explicit approval.

## Product Direction

STEM Forge is a premium structured learning platform for Scottish STEM students.
It is not a random question bank. Its learning model is:

**Learn -> Practise -> Exam Questions -> Master**

Within each skill path, the stages are:

1. Foundations
2. Applications
3. Past Paper-style Questions

Current proof of concept:

**Higher Maths -> Calculus -> Differentiation -> Basic differentiation**

- Higher Maths is the only available subject in the active UI.
- Higher Physics remains in the data/codebase but is deliberately locked and
  presented as coming soon.
- Basic differentiation is the active vertical slice.
- The active accent colour is blue. Do not assume older orange mockups represent
  the current visual direction.
- Claude may handle visual frontend work. Codex should protect architecture,
  data contracts, answer logic, progress/mastery semantics, tests and routing.

## Hard Boundaries

Do not add any of the following unless Finlay explicitly changes the strategy:

- authentication or user accounts
- Supabase or another database/backend
- payments
- AI tutor or AI marking
- analytics
- CMS
- external services
- large amounts of new course content

Progress is browser-local. The UI must be honest:

- Progress saved on this browser.
- No account needed.
- Local progress only.

Question content must be original SQA-style or exam-style material. Do not imply
that STEM Forge contains official or copied SQA questions. STEM Forge is not
affiliated with or endorsed by SQA.

## Architecture Completed

### Foundation and content architecture

- Next.js 15 App Router, TypeScript and Tailwind CSS.
- Reusable application shell, sidebar, top bar and page container.
- Subject-agnostic hierarchy:
  Subject -> Course Area -> Spec Area/Topic Hub -> Skill Path -> Stages -> Questions.
- Canonical Higher Maths and Higher Physics data.
- Data-driven subject, course-area, topic and skill-path pages.
- Central question registry and learning-path helpers.
- Markdown and KaTeX rendering for mathematical content.
- Dedicated question workspace with numerical, algebraic and multiple-choice
  answer handling.
- Content validation tooling and schema tests.

### Answer engine

- Answer acceptance logic was extracted and tested independently.
- Submission boundary tests protect the connection between the UI and answer
  engine.
- Do not casually change accepted-answer normalization or marking behaviour.
- Written/multi-step placeholders must not pretend to be automatically marked.

### Browser-local progress and mastery

- Progress uses a repository/storage abstraction rather than direct scattered
  localStorage calls.
- Current payload is version 2 and remains backward-compatible with version 1
  and older unversioned data.
- Incorrect-only attempts do not count as completion.
- Completion occurs after an independent correct answer, or after viewing the
  worked solution following a genuine attempt.
- Hint use and worked-solution use are recorded.
- Best outcome is preserved so a later mistake does not erase stronger earlier
  evidence.
- Mastery, completion, accuracy and support usage are separate concepts.
- Legacy records migrate conservatively; no existing progress is intentionally
  deleted.

Read before changing progress or mastery:

- `STEM_FORGE_PROGRESS_AND_MASTERY_RULES.md`
- `STEM_FORGE_PROGRESS_ARCHITECTURE.md`
- `STEM_FORGE_MASTERY_ARCHITECTURE.md`

### Automated quality coverage

- 71 unit/integration tests currently cover content, answer engine, submission
  boundary, progress payload/storage/calculations/migration and mastery.
- Playwright browser coverage contains 20 tests:
  - 19 desktop Chromium tests
  - 1 complete mobile Chromium journey
- Browser tests cover navigation, correct/incorrect submissions, hints, worked
  solutions, retries, next/previous navigation, progress consistency, reset,
  malformed storage, legacy migration, invalid routes and mobile overflow.
- Browser tests fail on unexpected page errors and console errors.
- Stable accessibility/test hooks were added only where necessary.

Read before changing browser tests:

- `STEM_FORGE_BROWSER_TESTING.md`
- `playwright.config.ts`
- `e2e/`

### Content version policy

The policy is documented but full runtime content versioning is intentionally not
implemented yet. It defines:

- stable logical question IDs
- monotonic `questionVersion` for material assessment changes
- `contentRevision` for minor wording/presentation fixes
- stage/path versions for structural changes
- archive rather than delete
- conservative treatment of legacy evidence

Read:

- `STEM_FORGE_CONTENT_VERSION_POLICY.md`

## Current Important Routes

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

At the end of Sprint 6, all listed production routes returned HTTP 200 and the
intentional not-found journey was covered by Playwright.

## Last Verified State

At the end of Sprint 6:

- `pnpm run typecheck` passed.
- `pnpm run lint` passed.
- `pnpm run validate-content` passed with zero errors and one expected legacy
  Higher Physics warning.
- `pnpm test` passed: 71/71.
- `pnpm build` passed and generated 22 routes.
- `pnpm run test:e2e:desktop` passed: 19/19.
- `pnpm run test:e2e:mobile` passed: 1/1.
- `pnpm run test:e2e` passed: 20/20 with zero retries.

These results describe the state at that checkpoint. Re-run checks after any
new Claude, Finlay or Codex changes.

## Commands

Normal commands:

```powershell
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run test:e2e
pnpm build
```

If `pnpm` is not available in Finlay's terminal, use Corepack:

```powershell
corepack enable
corepack pnpm dev
```

Do not paste the visible PowerShell prompt (`PS C:\...>`) as part of a command.

## Recommended Next Sprint

The next architecture sprint should implement the smallest safe portion of the
content-version policy, without adding a backend:

1. Add canonical optional version fields to question/path data types.
2. Validate stable IDs, positive versions and archive status.
3. Mark archived content without deleting it or exposing it as current practice.
4. Preserve old progress as historical evidence when a material question version
   changes.
5. Add focused unit tests before connecting version awareness to the UI.
6. Keep all current version 1, version 2 and unversioned local progress readable.

Before starting, inspect any newer Claude frontend changes. Keep this sprint
limited to data contracts, validation, migration policy and tests. Do not mix it
with a visual redesign.

## Product Follow-Ups To Revisit Later

Finlay explicitly asked to be reminded about these ideas:

- Add estimated completion times to learning stages.
- Add exam weighting to spec areas when reliable data is available.
- Later make question pages more interactive with confidence ratings and error
  tracking.
- Make Recommended Next data-driven using accuracy and recency instead of
  hardcoded suggestions.

These are not automatically the next sprint. They should wait until the content
and progress infrastructure is stable enough to support them honestly.

## Protected Statements

When reporting changes around the answer/progress system, verify and preserve
these statements unless the task explicitly changes them:

- Answer acceptance and rejection behaviour did not change.
- Progress and mastery semantics did not change.
- Existing version 1, version 2 and unversioned LocalStorage progress remains
  readable.
- No existing progress records were intentionally deleted.
- No database or authentication functionality was added.

## Suggested Opening Message For The New Conversation

Paste this into the next Codex conversation:

> We are continuing the STEM Forge project in
> `C:\Users\Finlay\Documents\STEMFORGE`. Read `STEM_FORGE_HANDOFF.md` first,
> then inspect the current code and any newer changes. Do not revert unfamiliar
> Claude or user frontend work. Preserve the answer engine and progress/mastery
> semantics. Higher Maths Basic differentiation is the active proof of concept;
> Higher Physics is locked/coming soon. Start by confirming the handoff against
> the codebase and recommend the smallest next sprint before editing anything.

