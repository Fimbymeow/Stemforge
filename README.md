# STEM Forge

STEM Forge is a calm, structured learning platform for Scottish SQA STEM students. It is currently a private beta, frontend-only proof of concept focused on one complete Higher Maths learning path.

## Current Beta Status

Active proof of concept:

Higher Maths -> Calculus -> Differentiation -> Basic differentiation

Higher Physics remains visible but locked / coming soon. The current beta is intended for 5-10 early student testers before more content is added.

STEM Forge creates original SQA-style practice materials and is not affiliated with or endorsed by SQA.

## Product Direction

STEM Forge is not intended to be a random question bank. The product guides students through a structured loop:

Learn -> Practise -> Exam Questions -> Master

The current beta focuses on testing the learning flow, question workspace, local progress, resource pages and mobile usability. Content comes later.

## Main Routes

- `/`
- `/dashboard`
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
- Browser localStorage for local-only progress

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

- No authentication or user accounts.
- No database.
- No Supabase.
- No payments or Stripe.
- No AI tutor or AI marking.
- No analytics.
- No CMS.
- Local progress is saved only in the current browser using localStorage.
- Reset is local-only; distributed deletion/tombstones are not implemented.
- Higher Maths Basic differentiation is the only active proof-of-concept path.
- Higher Physics is visible but locked / coming soon.
- Future skill paths still need dynamic route support before scaling content.

## Deployment Notes

This project is deployment-ready as a static/frontend Next.js MVP. There are no required environment variables for the current proof of concept. Set `NEXT_PUBLIC_SITE_URL` to the deployed beta URL when publishing so social preview metadata uses the correct domain.

Deployment hygiene:

- `.next` is ignored.
- `node_modules` is ignored.
- `.env` and `.env.local` are ignored.
- `.vercel` is ignored.
- No backend service is required.
- No localhost-only runtime URLs are required.

## Do Not Build Yet

Do not add these until the product direction explicitly changes:

- Supabase
- Authentication
- User accounts
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
- Keep progress copy honest: local progress only, saved on this browser, no account needed.
