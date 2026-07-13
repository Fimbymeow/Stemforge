# STEM Forge — orientation for Claude Code

STEM Forge is a private-beta, frontend-focused learning platform for Scottish SQA STEM students (Next.js 15 App Router, React 19, Tailwind 3). Higher Maths → Calculus → Differentiation → Basic differentiation is the one complete vertical slice. Higher Physics exists in the data but is locked/coming-soon. No backend, no auth, no payments — progress is `localStorage` only.

**Read `docs/frontend-work-plan.md` before starting new frontend work.** It has the current status and prioritized next steps from the last session in detail; this file is orientation, that file is the punch list.

## ⚠️ Parallel work you did not do and should not assume you understand

As of this write-up, `git status` shows a large body of **uncommitted, non-frontend work already in the working tree** that a prior/parallel session or the user produced — none of it was touched by the frontend session that wrote this file:

- `lib/progress/` (`calculations.ts`, `payload.ts`, `repository.ts`, `storage.ts`, `types.ts`) — a versioned (`ProgressPayloadV2`) progress/mastery data model with hint-tracking, "genuine attempt" tracking, and legacy migration from a V1 shape. This looks like it may be intended to **replace** `lib/local-progress.ts`, which the frontend session extended (see below). Diff the two before assuming either is the source of truth.
- `lib/answer-engine.ts`, `lib/content-validation.ts`, `scripts/validate-content.ts` — `pnpm build` now runs `validate-content` before `next build`.
- `tests/` (Node `--test` unit tests: content, answer-engine, progress payload/storage/calculations/migration, mastery model) and `e2e/` (Playwright specs: consistency-reset, migration-storage, mobile, navigation, question-flows).
- Root-level docs: `STEM_FORGE_ANSWER_ENGINE.md`, `STEM_FORGE_ARCHITECTURE_AUDIT.md`, `STEM_FORGE_BROWSER_TESTING.md`, `STEM_FORGE_CONTENT_ARCHITECTURE.md`, `STEM_FORGE_CONTENT_VERSION_POLICY.md`, `STEM_FORGE_MASTERY_ARCHITECTURE.md`, `STEM_FORGE_PROGRESS_AND_MASTERY_RULES.md`, `STEM_FORGE_PROGRESS_ARCHITECTURE.md`.
- `package.json` gained `@playwright/test`, `tsx`, and a full `test`/`test:e2e`/`validate-content` script set.

**Before touching progress/answer/mastery logic, read those docs and check whether `lib/progress/` supersedes `lib/local-progress.ts`.** `pnpm run test` (43+ tests, all passing as of last session) covers that other work — run it after any change that touches progress, answers, or content data, not just `typecheck`/`lint`/`build`.

## Design system (established this session)

Tokens live in `tailwind.config.ts`:

| Token | Hex | Role |
|---|---|---|
| `forge` | `#234b6e` | Brand accent (ink-blue — was orange `#ff7514`, deliberately changed) |
| `forge-soft` | `#e4ebf1` | Accent tint (icon tiles, badges) |
| `paper` | `#f5f4f0` | Page background |
| `ink` | `#16191c` | Body text |
| `muted` | `#6e6a62` | Secondary text |
| `line` | `#e2dfd7` | Borders |
| `success` / `success-soft` | `#2f7a4d` / `#e4f1e8` | Correct-answer state only |
| `danger` / `danger-soft` | `#b23a34` / `#f6e4e2` | Incorrect-answer state only |
| `warning` / `warning-soft` | `#8a6118` / `#f7edd9` | Reserved, not yet used in UI |

**Semantic colors (`success`/`danger`) are never reused for brand decoration, and `forge` is never reused for grading.** This was a real bug fixed this session (wrong-answer state used to reuse the brand orange tint) — don't reintroduce the collision.

Card recipe used everywhere: `rounded-2xl border border-line bg-white shadow-card` (via `components/ui.tsx`'s `Card`). Icon tiles: `size-{10-12} rounded-xl bg-forge-soft text-forge`. Buttons: solid `bg-forge text-white`, sentence case, `rounded-lg` — **not** uppercase/bordered (that's a legacy `ButtonLink` style from `components/ui.tsx` still used on landing pages only; don't introduce it into app/product pages, it was already found and removed from two app pages this session).

## Patterns to follow

**Hydration-safe local progress reads.** Any component reading `getSkillPathProgress`/`getStageProgress`/`getNextQuestionId` from `lib/local-progress.ts` must gate the read with `useHasMounted()` from `lib/use-mounted.ts`:
```ts
const hasMounted = useHasMounted();
const progress = getSkillPathProgress(skillPath, hasMounted ? undefined : []);
```
Without this, server and first-client-paint disagree (server has no `localStorage`) and React throws a hydration mismatch. This was a real, verified bug found and fixed this session across 6 components. If `lib/progress/` (see warning above) is now the real data source, port this same pattern to whatever hook reads it.

**Product register, not brand register.** These are app/tool pages, not marketing pages. Restrained color (one accent), no gradients/glassmorphism/decorative motion, sentence case everywhere, one primary action per page. The landing page (`components/landing/*`) is brand register and was never touched — its uppercase eyebrows and different button style are a deliberate, separate register, not something to "fix" to match the app.

## Known environment gotcha

Running `pnpm run build` while a `pnpm run dev` server is live against the same `.next` directory **corrupts the webpack cache** (`Error: invalid block type`, `MODULE_NOT_FOUND`, pages go blank or 500). Symptom-fix: stop the dev server, `rm -rf .next`, restart. Hit this twice in one session before recognizing the pattern — stop the dev server before running `pnpm build`, or accept the cache-clear as a known cost.

## Scope boundaries (still apply)

Frontend visual work only. Do not change: question logic, answer-checking/marking logic (`normaliseAnswer` in `question-workspace.tsx` has a known risk — strips `*`/braces before comparing — flagged, not fixed, out of scope), routes' underlying data (only 2 redirects added, both for pages made redundant by the new roadmap nav, not data changes), local-progress *computation* logic (only read-timing was changed, not values), Higher Maths/Physics availability rules, SQA-independence or beta/no-account copy. No new dependencies, no backend, no auth/payments/AI/analytics.
