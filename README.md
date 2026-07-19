# STEM Forge

Platform performance, accessibility, security, reliability, browser support, and deployment checks are documented in [STEM_FORGE_PERFORMANCE_ACCESSIBILITY_SECURITY_RELIABILITY.md](./STEM_FORGE_PERFORMANCE_ACCESSIBILITY_SECURITY_RELIABILITY.md). Run `pnpm run verify:deployment` for a redacted local readiness dry run and `pnpm run test:e2e:hardening` for the Chromium/Firefox/WebKit critical matrix.

Production provider, environment, migration-status, smoke-test, rollback and release procedures are documented in [STEM_FORGE_PRODUCTION_DEPLOYMENT_AND_RELEASE_VERIFICATION.md](./STEM_FORGE_PRODUCTION_DEPLOYMENT_AND_RELEASE_VERIFICATION.md). The stable release target is `https://stemforge-6an8.vercel.app`; authenticated production remains blocked until its Vercel and Supabase production configuration is completed.

STEM Forge is a calm, structured learning platform for Scottish SQA STEM students. It is currently a private beta with one complete Higher Maths learning path, a generic multi-path content runtime, optional Supabase accounts, explicitly confirmed browser-progress import, opt-in incremental cross-device evidence synchronization, shared-device-safe account data controls, an evidence-driven learner dashboard, interactive maths graphs/nature tables, and a generic local revision/practice-session engine.

## Current Beta Status

Active proof of concept:

Higher Maths -> Calculus -> Differentiation -> Basic differentiation

Higher Physics remains visible but locked / coming soon. The current beta is intended for 5-10 early student testers before more content is added.

STEM Forge creates original SQA-style practice materials and is not affiliated with or endorsed by SQA.

## Product Direction

STEM Forge is not intended to be a random question bank. The product guides students through a structured loop:

Learn -> Practise -> Exam Questions -> Master

The current beta focuses on testing the learning flow, question workspace, evidence-driven dashboard, local progress, resource pages and mobile usability. Content comes later.

## Main Routes

- `/`
- `/dashboard`
- `/graph-demo`
- `/subjects`
- `/subjects/higher-maths`
- `/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- `/question/hm-calc-diff-basic-f-001`
- `/subjects/higher-maths/question-bank`
- `/subjects/higher-maths/revision-notes`
- `/subjects/higher-maths/formula-cards`
- `/subjects/higher-maths/worked-examples`
- `/subjects/higher-maths/flashcards`
- `/subjects/higher-physics`
- `/resources`

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- KaTeX / Markdown rendering for maths content
- Browser localStorage as the local-first progress runtime, with optional append-only account synchronization

Account and browser-data behavior is documented in `STEM_FORGE_ACCOUNT_DATA_AND_SHARED_DEVICE_SAFETY.md`. Browser removal is local only: it does not delete synchronized account evidence or data on other devices.

Dashboard recommendations and learner-home summaries are documented in `STEM_FORGE_EVIDENCE_DRIVEN_DASHBOARD.md`. Dashboard UI should consume the derivation layer rather than reimplementing progress, mastery, activity or sync meaning in React components.

Interactive graph and nature-table infrastructure is documented in `STEM_FORGE_INTERACTIVE_MATHS_GRAPHS_AND_NATURE_TABLES.md`. It uses authored, validated expression ASTs and structured mathematical answers, not arbitrary expression execution or freehand sketch recognition.

Revision and assessment sessions are documented in `STEM_FORGE_REVISION_AND_ASSESSMENT_ENGINE.md`. They build targeted, mixed, needs-work, retry-incorrect and optional timed sessions from available canonical questions while keeping session state local and submitted attempts in canonical progress.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open the local URL printed by Next.js, usually:

`http://127.0.0.1:3000`

If that port is busy, use another port:

```bash
pnpm dev --port 3038
```

## Checks

Validate content IDs, relationships and required question fields:

```bash
pnpm run validate-content
```

Run the focused content-integrity tests:

```bash
pnpm test
```

Run only the answer-engine regression tests:

```bash
pnpm run test:answers
```

Run only payload, migration, storage and progress-semantic tests:

```bash
pnpm run test:progress
```

Run focused mastery-model tests:

```bash
pnpm run test:mastery
```

Run completion acknowledgement storage tests:

```bash
pnpm run test:completion
```

Run the production browser regression suite (Chromium is required):

```bash
pnpm exec playwright install chromium
pnpm run test:e2e
```

Focused and interactive commands:

```bash
pnpm run test:e2e:desktop
pnpm run test:e2e:mobile
pnpm run test:e2e:completion
pnpm run test:sync
pnpm run test:database
pnpm run test:e2e:import:real
pnpm run test:e2e:sync:real
pnpm run test:e2e:ui
pnpm run test:all
```

Browser tests use isolated contexts and the real local progress key; they do not use personal browser progress. See `STEM_FORGE_BROWSER_TESTING.md` for fixtures, artifacts, and debugging guidance.

The path-completion acknowledgement is stored separately from progress and cannot determine completion or mastery. See `STEM_FORGE_COMPLETION_EXPERIENCE.md` for variants, replay prevention, reset behavior and payload safety.

Run TypeScript:

```bash
pnpm run typecheck
```

Run lint:

```bash
pnpm run lint
```

Run production build:

```bash
pnpm build
```

Production builds run content validation before Next.js compiles the application. Validation errors block the build; warnings are reported without failing it.

Canonical content now includes conservative version/revision and active/archive lifecycle metadata. Learner-facing selectors exclude archived records, while explicit historical lookup remains available for future admin/history work. Run `pnpm run test:content-version` for the focused regression suite and see `STEM_FORGE_CONTENT_VERSION_ARCHITECTURE.md` for the identity map and migration boundary.

Local progress now uses payload V4. Attempts, support events, and structural achievement snapshots have stable event IDs. V3 and older progress migrates conservatively with deterministic IDs and no invented snapshots. Current-version readiness stays separate from immutable historical stage/path achievement. See `STEM_FORGE_STRUCTURAL_ACHIEVEMENTS_AND_MERGING.md`.

## Testing Priorities

- Full route smoke test.
- Homepage -> Dashboard -> Subjects -> Higher Maths -> Basic differentiation -> Question journey.
- Correct and incorrect answer submission.
- Worked solution, hint and common mistake visibility.
- Local progress before/after attempts, after refresh and after reset.
- Mobile/iOS Safari usability, especially the question input and maths keypad.
- Higher Physics locked state.
- Public tester URL opens without login or deployment protection.

See `STEM_FORGE_PRIVATE_BETA_READINESS.md` for the verified readiness decision, `docs/private-beta-checklist.md` for the practical session checklist, and `docs/private-beta-feedback-template.md` for reusable tester questions.

## Current Limitations

- Authentication is optional and controlled by the server; guest learning remains available.
- Confirmed import is not continuous cross-device synchronization.
- Remote evidence is append-only for normal traffic. Confirmed account learning-data erasure is implemented for remote evidence only; full account closure, Supabase identity deletion, distributed reset tombstones and legal retention automation remain deferred.
- No payments or Stripe.
- No AI tutor or AI marking.
- No analytics.
- No CMS.
- Active learning continues to save progress in the current browser using localStorage. A signed-in learner may explicitly add that evidence to their account without deleting the local copy.
- Reset is local-only; distributed deletion/tombstones are not implemented.
- Higher Maths Basic differentiation is the only active proof-of-concept path.
- Higher Physics is visible but locked / coming soon.
- Generic dynamic path routing exists, but only Basic differentiation has reviewed production questions.

## Deployment Notes

Guest-only builds remain credential-free. Optional accounts and confirmed import require the server-side auth and PostgreSQL settings documented in `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the deployed beta URL when publishing so social preview metadata uses the correct domain.

Deployment hygiene:

- `.next` is ignored.
- `node_modules` is ignored.
- `.env` and `.env.local` are ignored.
- `.vercel` is ignored.
- Guest learning does not require a backend service. Account import requires configured Supabase Auth and restricted PostgreSQL runtime access.
- No localhost-only runtime URLs are required.
- Internal beta triage is an optional fail-closed server workspace documented in `STEM_FORGE_INTERNAL_BETA_OPERATIONS_AND_TRIAGE.md`; it is never part of learner navigation.

## Explicitly Deferred

Do not add these until separately authorized:

- Distributed reset, full account closure, identity deletion or legal retention automation
- Payments / Stripe
- AI tutor
- AI marking
- Analytics
- CMS
- Large new content sets

## Important Product Constraints

- Higher Maths is available now.
- Higher Physics is coming soon.
- Keep the UI calm, compact and premium.
- Use original SQA-style and exam-style questions.
- Keep the stage label: `Past Paper-style Questions`.
- Avoid Easy / Medium / Hard in the active learning journey.
- Keep progress copy honest: learning is saved on this browser and needs no account; confirmed import and opt-in synchronization are separate account features, and browser reset does not erase remote evidence.
