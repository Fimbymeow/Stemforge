# STEM Forge — orientation for Claude Code

STEM Forge is a private-beta learning platform for Scottish SQA STEM students (Next.js 15 App Router, React 19, Tailwind 3). Higher Maths → Calculus → Differentiation → Basic differentiation is the complete production slice; the content resolver and routes are multi-path capable. Guest progress is canonical V4 evidence in localStorage. Optional Supabase SSR authentication maps verified users to immutable PostgreSQL owners. Sprint 14 adds confirmed append-only import, Sprint 15 adds explicit incremental sync, and Sprint 16 adds provenance-backed shared-device controls and safe sign-out.

**Read `docs/frontend-work-plan.md` before starting new frontend work.** It has the current status and prioritized next steps from the last session in detail; this file is orientation, that file is the punch list.

Sprint 18 adds the evidence-driven learner dashboard. `lib/dashboard-derivations.ts` is the canonical dashboard meaning layer; Dashboard React components should pass browser evidence and sync state into this derivation layer rather than re-implementing continue recommendations, recent activity, needs-work, secure/mastered state, weekly activity or sync copy in JSX. Read `STEM_FORGE_EVIDENCE_DRIVEN_DASHBOARD.md` before changing `/dashboard`.

Sprint 19 adds the interactive maths graph and nature-table foundation. `lib/maths/*` owns the safe authored-expression AST, derivative support, graph sampling, transformations and function analysis. `lib/questions/graph-answer-validation.ts` owns structured graph/nature-table answer validation. Do not add `eval`, `new Function`, arbitrary student expression parsing, freehand sketch recognition or broad content expansion. Read `STEM_FORGE_INTERACTIVE_MATHS_GRAPHS_AND_NATURE_TABLES.md` before changing graph interactions.

Sprint 20 adds the generic revision and assessment engine. `lib/practice/*` owns the local session model, eligibility, deterministic selection, storage and summaries. Practice must discover questions through canonical content, reuse `QuestionWorkspace` and canonical progress attempts, keep session UI state browser-local, and avoid answer keys, duplicated question content or remote session tables. Read `STEM_FORGE_REVISION_AND_ASSESSMENT_ENGINE.md` before changing practice behavior.

Sprints P2–P4 ("Phase II — Product Excellence") are complete and committed (`240af65`, `05f5fe3`, `09f6d48`). P3 introduced the single canonical `useLearnerNextAction()` hook (`components/learning/use-learner-next-action.ts`, backed by `lib/learning/next-action.ts`) — every "what should the student do next" surface (question workspace, path-completion panel, dashboard) must read from this, not reimplement page-local next-action logic. P4 restructured `QuestionWorkspace`: the question/answer now sits above the fold, feedback is classified into seven categories (`lib/questions/answer-feedback.ts`), answers auto-save as version-scoped local drafts (`lib/questions/answer-drafts.ts`, key `stemforge.answerDrafts.v1`, fully separate from progress/evidence), and worked solutions can progressively reveal authored `{title, body}[]` steps (`lib/questions/worked-solution.ts`) with a safe full-text fallback for the current all-string content. This was reviewed end-to-end before commit (see `git log -1 09f6d48`); the one finding (a decorative, non-toggling `aria-expanded` on the progressive-solution buttons) was fixed and folded in. Read `STEM_FORGE_PRODUCT_EXCELLENCE_P4.md` before touching answer submission, drafts, or worked-solution rendering.

Sprint P5 ("Student-Facing Clarity") is complete and committed (`5574c3c`) — see `STEM_FORGE_PRODUCT_EXCELLENCE_P5.md` for the full audit, glossary and decision record. It replaced engineering vocabulary ("evidence," "canonical," "Synchronization," "association," raw status enums, a live "N available, N planned" beta counter, "proof of concept") with plain learning language across the landing page, dashboard, practice, and account/sync surfaces, without changing any marking, progress, mastery, sync, import, or next-action semantics. Two structural-consistency fixes landed alongside the copy pass: `formatProgressStatusLabel()` (`components/learning/mastery-badge.tsx`) is now the single source for Completed/Secure/Mastered/Not Started/In Progress labels (three components previously hand-wrote the same logic independently), and `syncStatusLabel()` (`components/progress-sync-status.tsx`) is now shared between the topbar pill and the account sync panel badge. Also standardized "SQA" → "Qualifications Scotland" everywhere (explicit product decision, given the real-world naming transition) and renamed the legacy Higher Physics difficulty tier `"Secure"` → `"Standard"` in `data/questions.ts` to stop it colliding with the mastery-tier "Secure" label. Read `STEM_FORGE_PRODUCT_EXCELLENCE_P5.md` before touching student-facing copy on any of those surfaces.

Sprint P6 ("Progression and Motivational Rhythm") is complete but **not yet committed** — see `STEM_FORGE_PRODUCT_EXCELLENCE_P6.md` for the full audit, hierarchy and decision record. It added the stage-completion moment that never existed before (`components/learning/stage-completion-panel.tsx`, triggered from `QuestionWorkspace` the same way path completion is, one-time-tracked via a new `stemforge.stageCelebration.v1` key — `LocalStorageCelebrationStorage` in `lib/completion-tracking.ts` was generalized to take a `storageKey` param rather than duplicating the class), fixed a real bug where completing a path inside a practice session silently burned the one-time celebration claim without ever showing it (`components/practice/practice-session.tsx` now claims and shows path completion in the summary instead), added a quiet fully-correct-session acknowledgement, replaced generic dashboard accomplishment labels ("Stage Completed") with specific ones ("Foundations completed", including a provable "first full path completed" framing) via a rewritten `achievementTitle()` in `lib/dashboard-derivations.ts`, and added grounded per-question review-reason language (`lib/questions/review-reason.ts`, surfaced on the question workspace) derived from existing `bestOutcome`/`latestResult` signals — never inferring ability or effort. No streaks, XP, badges-by-threshold, or other gamification were introduced. Read `STEM_FORGE_PRODUCT_EXCELLENCE_P6.md` before touching stage/path completion, dashboard accomplishment language, or review-reason presentation.

Sprint P7 ("Mobile and Accessible Learning") is complete but **not yet committed** — see `STEM_FORGE_PRODUCT_EXCELLENCE_P7.md` for the full audit, fix-by-fix rationale and honesty disclosures. It fixed a skip link that looked correct but didn't actually skip navigation (the wrapper `div` holding `id="main-content"` was an *ancestor* of both nav and main, positioned before nav in the tree — `id`/`tabIndex={-1}` now live on the real `<main>` landmark across every shell/error/terminal component), fixed a beta-notice/feedback-dock visual collision on small viewports via a shared bottom-anchored stack in `AppShell` with safe-area-inset handling, fixed the sidebar nav's mobile layout so all four destinations are individually reachable at 320px without horizontal scrolling, and extracted `lib/use-modal-focus-trap.ts` (generalized from `ReportDialog`'s already-correct inline trap) so the two destructive account dialogs (`AccountDataControls`, `SafeSignOut`) that claimed `alertdialog`/`aria-modal` without real focus containment now have it for real. Also bumped several controls up to the app's established 40px touch-target floor and fixed one confirmed WCAG AA contrast failure (worked-example "Common mistake" callout). `e2e/platform-hardening.spec.ts` (real Chromium/Firefox/WebKit, not viewport-emulated Chromium) is the authoritative keyboard/focus-trap evidence — it proves the skip link's next Tab never returns to nav and that the shared trap wraps Tab in both directions. No real assistive-technology or physical-device testing was performed this sprint (accessibility-tree inspection stood in for AT; browser-engine emulation stood in for devices) — read `STEM_FORGE_PRODUCT_EXCELLENCE_P7.md` §16 and §22 before claiming either. No marking/progress/mastery/achievement/sync/import/next-action semantics changed. The full verification gate is clean: typecheck, lint, content validation, all unit-test suites, the production build, the cross-browser hardening suite, and the full ordinary e2e suite (90/90) all pass. That gate initially found one unrelated, pre-existing failure — `e2e/dashboard.spec.ts`'s "recent activity" test hardcoded absolute July 2026 attempt timestamps, and `lib/dashboard-derivations.ts`'s real 7-day rolling-activity window (measured against the actual browser clock) eventually drifted past them — fixed as a narrowly scoped, separately approved verification-maintenance correction: that one test now freezes the browser clock with `page.clock.setFixedTime(...)` to an instant compatible with its existing fixture dates, so the real rolling-window calculation is still exercised, just no longer at the mercy of the calendar date the suite happens to run on. Read `STEM_FORGE_PRODUCT_EXCELLENCE_P7.md` before touching the skip link, app shell chrome, modal dialogs, or mobile nav.

Sprints P8 and P9 are committed (`58e2532`, `69d5f2e`). P10 is targeted presentation polish only and is currently uncommitted; read `STEM_FORGE_PRODUCT_EXCELLENCE_P10.md` before changing beta-notice positioning, focused account/recovery shells, Question Bank filter geometry, roadmap sizing, account action presentation, or product mockup accents. P10 preserves all P2–P9 learning and data semantics.

## Path-completion celebration (not a numbered sprint — built directly with the user)

A one-time acknowledgement fires the moment a skill path crosses incomplete → complete, plus a permanent completed/secure/mastered hero state on revisit. Key pieces:
- `lib/completion-tracking.ts` — `LocalStorageCelebrationStorage`, key `stemforge.pathCelebration.v1` (versioned, migrates a legacy flat shape). Deliberately separate from `stemforge.localProgress.v1`; UI acknowledgement only, never progress truth.
- `components/learning/mastery-badge.tsx` — the 3-tier badge system: `completed` = outline, `secure` = soft-fill, `mastered` = solid-fill, all in `forge` blue (one accent, three weights) plus a `warning`/`warning-soft` "Review recommended" chip that stacks on any tier (this is what put the previously-reserved `warning` token into real use).
- `components/learning/path-completion-panel.tsx` — the completion moment itself; renders in place of the Previous/Next row in `QuestionWorkspace` only on the exact submission that completes the path (ref-guarded, hydration-safe against the empty-evidence SSR snapshot).
- Detection logic lives inline in `QuestionWorkspace` (snapshot "was the path already complete" once real evidence is available, compare on next progress change) — this predates and now composes with Sprint P3's `useLearnerNextAction`.

## Tuition marketing sub-site (`/tuition/*`, `components/tuition/*`)

A separate, self-serve 1:1 tuition offering (National 5 / Higher, Maths and Physics, £20/£25 per hour, free trial), built as its own small site-within-the-site — **not** part of the STEM Forge learning app itself, and not the "duplicate tuition Vercel project" warned about below (that's a deployment-naming footgun; this is in-app routes on the main `stemforge-6an8` project). Has its own nav/footer (`TuitionNavbar`/`TuitionFooter`), its own sentence-case button component (`TuitionButtonLink`, deliberately distinct from the app's uppercase `ButtonLink`), a warm-gold pill-kicker + italic-serif-emphasis accent system reusing the `warning`/`warning-soft` tokens (verified 4.75:1 contrast; **never** put `text-warning` directly on `bg-forge` — that pairing is 1.65:1 and fails, use `text-warning-soft` on dark backgrounds instead), and a scroll-reveal/stagger animation system (`components/tuition/tuition-reveal.tsx`) that only ever hides content after confirming an observer is armed to reveal it, so hydration failure or a headless renderer can't leave text stuck invisible.

**Before this goes live, three bracketed placeholders must be replaced with real content** (all clearly marked in the JSX so they can't ship by accident):
- Contact email in `components/landing/tuition-contact-form.tsx` (currently `tuition@stemforge.app`).
- Tutor bio in `components/tuition/tuition-about.tsx` (`[Your name]`, `[Qualifications...]`, `[X years]`, bio paragraph).
- Two testimonial quotes in `components/tuition/tuition-testimonials.tsx`.

## Independent product audit

A from-scratch, first-time-student critique of the whole product (own scores, own ranked improvements, own sprint groupings, explicit vetoes, and an agree/partial/disagree comparison against a separately-authored "Sprint P1" audit) was produced this session and published as a Claude artifact (https://claude.ai/code/artifact/54e9edb9-65f1-43a9-858c-21793dad6534) — it is **not** committed to the repo. Worth reading before scoping Sprint P5+: it independently found the dashboard's "12 planned" framing, the broken in-question "Formula Sheet" link to a dead `/resources` stub, and a "Retry incorrect" that doesn't actually retry the session just completed, among other things the P1 audit didn't name.

## Historical frontend-session note

The following paragraph originally described uncommitted parallel work. That work was subsequently reviewed, integrated and committed in Sprints 1–14; it is retained only to explain older design notes.

- `lib/progress/` (`calculations.ts`, `payload.ts`, `repository.ts`, `storage.ts`, `types.ts`) — a versioned (`ProgressPayloadV2`) progress/mastery data model with hint-tracking, "genuine attempt" tracking, and legacy migration from a V1 shape. This looks like it may be intended to **replace** `lib/local-progress.ts`, which the frontend session extended (see below). Diff the two before assuming either is the source of truth.
- `lib/answer-engine.ts`, `lib/content-validation.ts`, `scripts/validate-content.ts` — `pnpm build` now runs `validate-content` before `next build`.
- `tests/` (Node `--test` unit tests: content, answer-engine, progress payload/storage/calculations/migration, mastery model) and `e2e/` (Playwright specs: consistency-reset, migration-storage, mobile, navigation, question-flows).
- Root-level docs: `STEM_FORGE_ANSWER_ENGINE.md`, `STEM_FORGE_ARCHITECTURE_AUDIT.md`, `STEM_FORGE_BROWSER_TESTING.md`, `STEM_FORGE_CONTENT_ARCHITECTURE.md`, `STEM_FORGE_CONTENT_VERSION_POLICY.md`, `STEM_FORGE_MASTERY_ARCHITECTURE.md`, `STEM_FORGE_PROGRESS_AND_MASTERY_RULES.md`, `STEM_FORGE_PROGRESS_ARCHITECTURE.md`.
- `package.json` gained `@playwright/test`, `tsx`, and a full `test`/`test:e2e`/`validate-content` script set.

`lib/progress/` is the canonical evidence/storage/calculation architecture. `lib/local-progress.ts` is the active compatibility boundary used by components. Read the current handoff and architecture documents before changing either, and run the focused plus complete gates.

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

Preserve the existing answer, progress, content-version, archive, guest-access and SQA-independence rules unless a sprint explicitly changes them. Never trust a client owner ID, mutate accepted remote evidence, treat historical snapshots as current readiness, import celebration acknowledgement state, or imply that confirmed import is continuous sync. Payments, AI marking and analytics remain out of scope.

Read `STEM_FORGE_ACCOUNT_DATA_AND_SHARED_DEVICE_SAFETY.md` before changing sign-out, account switching, sync consent, provenance, reset wording or browser-data removal. Never attribute legacy evidence by guess, silently associate a different account, or claim local removal deletes append-only remote evidence.

Read `STEM_FORGE_INTERNAL_BETA_OPERATIONS_AND_TRIAGE.md` before changing internal report routes, authorization, filters, workflow, audit, health or learner-visible report status. Internal access always requires the server-only enable flag, a valid opaque-owner allowlist and a verified matching session; development has no bypass.

Read `STEM_FORGE_PRODUCTION_DEPLOYMENT_AND_RELEASE_VERIFICATION.md` before deployment, environment, canonical-origin, health/readiness, migration-status or production-smoke work. Vercel project `stemforge-6an8` on `main` is the release target; never treat `stemforge.app`, preview URLs, or the duplicate `stemforge`/`tuition` projects as canonical.
