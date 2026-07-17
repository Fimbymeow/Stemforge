# STEM Forge Conversation Handoff

Last updated: 17 July 2026
Current checkpoint: Sprint 18 evidence-driven dashboard and learner home

This is the durable starting point for a new Codex conversation. Inspect the repository before editing. Preserve unfamiliar Finlay, Claude, or Codex changes and never reset a dirty tree without explicit approval.

## Product vision

STEM Forge is a structured Scottish SQA STEM learning platform, not a random question bank. Its learning loop is:

**Learn -> Practise -> Exam Questions -> Master**

The canonical learner hierarchy is Subject -> Course area -> Specification strand -> Skill path -> Stage -> Question. Stages are Foundations, Applications, and Past Paper-style Questions. Specification strands expose official SQA structure; skill paths remain the progress and mastery unit.

The only active learner-ready vertical slice is:

**Higher Maths -> Calculus -> Differentiating functions -> Basic differentiation**

It contains eight active canonical questions in a 3/3/2 stage structure. Higher Physics is a separate locked/read-only legacy demonstration and has not been migrated. Other visible paths and subjects are coming soon, not available practice.

The approved visual baseline uses warm off-white backgrounds, white cards, subtle borders/shadows, and muted blue as the main application accent. Orange is supporting brand colour only.

## Private-beta position

Learning remains browser-local and needs no account or network after the application is loaded. Authenticated learners may explicitly associate a browser for incremental append-only synchronization; guest use remains unchanged. The private-beta package is in `docs/private-beta-checklist.md`, the reusable feedback questions are in `docs/private-beta-feedback-template.md`, and readiness evidence is in `STEM_FORGE_PRIVATE_BETA_READINESS.md`.

Historical Sprint 10 boundary: no authentication or database was added in that sprint. Sprints 12–14 subsequently added remote persistence, optional accounts, trusted ownership and explicitly confirmed import through separately approved work.

## Evidence-driven dashboard

Sprint 18 makes `/dashboard` the learner home rather than a single Basic differentiation progress card. The canonical dashboard source of truth is `lib/dashboard-derivations.ts`; React components should pass local evidence and sync state into that layer instead of re-deriving next action, needs-work, recent activity, secure/mastered state, weekly activity or sync copy in JSX.

The dashboard remains guest-safe and local-first. It can display conservative account sync status when auth is enabled, but it must not require credentials or expose server-only auth flags. See `STEM_FORGE_EVIDENCE_DRIVEN_DASHBOARD.md` before changing dashboard behavior.

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

## Remote evidence foundation

Sprint 12 adds a server-only asynchronous PostgreSQL repository without connecting it to the learner application. `pg` is the runtime driver, `node-pg-migrate` applies committed forward-only migrations, and `embedded-postgres` is a dev-only native PostgreSQL 17 integration harness. The schema stores attempts, support events, snapshots and conflicts as immutable owner-scoped JSONB rows with database receive timestamps and one global receive cursor.

Database triggers reject UPDATE, DELETE and TRUNCATE. Identical retries are idempotent; same-ID/different-payload arrivals preserve the accepted row and append one deduplicated conflict. `lib/remote-evidence/validation.ts` accepts canonical V4 only while retaining `unknown_legacy` and archived/unknown logical references. No API route, authentication, sync or browser import exists.

Read `STEM_FORGE_REMOTE_EVIDENCE_FOUNDATION.md` before authentication or remote transport work. `STEMFORGE_DATABASE_URL` is runtime-only; migration/test URLs are separate. Missing database configuration affects only explicit remote repository invocation. LocalStorage remains the complete active learner runtime.

## Authentication and trusted ownership

Sprint 13 adds feature-controlled Supabase email/password account routes using cookie-based SSR and PKCE callback exchange. The server verifies current users with Supabase `getUser()` and maps the immutable provider subject to a database-generated opaque owner through `stemforge_identity`. Transaction advisory locking makes concurrent first mapping stable without orphan owners. Identity rows are immutable and contain no email/profile.

The canonical production boundary is `resolveCurrentAuthenticatedOwner()`. Browser owner IDs are never inputs. Sprint 14 connects that boundary to confirmed `/api/progress/import`; Sprint 15 adds separate opt-in `/api/progress/sync/*` push, pull and context routes while reusing the trusted append service. Accounts are hidden unless `STEMFORGE_AUTH_ENABLED=true` and configuration is complete. Real Supabase verification covers signin, stable owner mapping, session persistence, confirmed import and two-device synchronization against disposable PostgreSQL without printing credentials. Read `STEM_FORGE_AUTHENTICATION_AND_OWNERSHIP.md` and `STEM_FORGE_INCREMENTAL_PROGRESS_SYNC.md` before changing this boundary.

The server `RootLayout` resolves account availability and serializes one stable boolean through a client context; client navigation never reads the server-only flag. The ordinary Playwright regression server forces auth off and blanks optional auth/database test variables, so `.env.local` cannot change the deterministic guest-learning suite. A separate synthetic enabled-rendering test proves the Account entry hydrates without console or page errors. Genuine Supabase checks remain a separate, explicitly configured verification path. A repository runner owns the direct Next child and bounded cleanup because Playwright 1.61's shell-based Windows `webServer` teardown could wait indefinitely after report generation.

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

## Sprint 11 runtime source of truth

`data/canonical-content.ts` is the sole production canonical registry and `lib/content-resolver.ts` is the pure Higher Maths resolution boundary. It resolves subject, course area, specification strand, path, stage, question, path-scoped position, previous/next and destinations. Shared helpers no longer import Basic Differentiation questions directly. `lib/question-bank-query.ts` owns pure search/filter/sort derivation, and `lib/dashboard-derivations.ts` exposes path-agnostic future dashboard summaries.

The six official Calculus headings are explicit ordered specification strands. Thirteen active path records exist: Basic Differentiation remains the sole learner-ready path and the others are honest metadata-only coming-soon paths. A second available path and its three questions exist only in `tests/fixtures/multi-path-content.ts`; they prove genericity without production content.

No stable existing ID, production URL, question/stage/path assessment version, persisted progress shape, marking rule, completion rule or mastery rule changed. Higher Physics remains the separate unmigrated legacy boundary. Read `STEM_FORGE_SQA_TAXONOMY_AND_MULTI_PATH_RUNTIME.md` before importing another path.

## Current verification baseline

Sprint 10 began from commit `d515ca2` and reproduced:

- frozen lockfile install: consistent/already up to date;
- TypeScript: passing;
- ESLint: passing;
- content validation: 0 errors, 1 expected legacy Physics warning;
- unit/integration tests: 124 passing;
- production build: passing, 22 routes;
- Playwright: 38 passing baseline tests with Chromium actually launched.

Sprint 10 completed at commit `007eae8` with 124 unit/integration tests, 39 desktop tests, 2 mobile tests and 41 total browser tests. Sprint 11 completed at `311b8a3` with 136 unit/integration tests, 42 desktop tests, 3 mobile tests and 45 total browser tests. Sprint 12 verifies 144 unit/integration tests, 10 focused real PostgreSQL integration tests, 42 desktop tests, 3 mobile tests, 45 total browser tests and a 22-route production build.

The Sprint 13 checkpoint verified 158 unit/integration tests, a 28-route production build, 43 ordinary desktop tests, 4 ordinary mobile tests and 1 isolated synthetic auth-enabled hydration test. Later Tuition routes and Sprint 14 import coverage supersede those historical counts; use the latest completed gate recorded below.

## Sprint 14 confirmed import

The authenticated account page now detects canonical browser evidence after hydration and shows a neutral summary. Import is never automatic: the learner reviews and confirms before `POST /api/progress/import` sends a strict V4 envelope. The route bounds raw and canonical sizes, requires configured same-origin JSON, resolves the owner only from the verified session, and returns minimum per-event committed classifications.

Accepted account evidence remains append-only. Identical retries return the original trusted receive cursor/time, same-ID semantic conflicts remain in `evidence_conflicts`, and unexpected SQL failure rolls back the valid batch. Four `NOT VALID` owner foreign keys enforce real application owners for new rows while preserving historical pre-authentication evidence.

Canonical local evidence remains unchanged. Separate `stemforge.progressImport.v1` metadata stores acknowledged IDs per non-sensitive account fingerprint. It unions latest acknowledgements under a Web Lock where available, warns about prior different-account acknowledgement, and leaves rejected or ambiguous events pending. Celebration acknowledgement is not imported. This remains confirmed import only; continuous push/pull sync, distributed reset and deletion are deferred to separately approved work.

## Current verified baseline

The completed Sprint 14 gate verifies 174 unit/integration tests, a 33-route production build, 43 ordinary desktop tests, 4 ordinary mobile tests, 1 isolated synthetic auth-enabled hydration test, and 19 embedded PostgreSQL migration/repository tests. The separate genuine Supabase import path passes 4/4 across desktop and mobile while using a newly created disposable local PostgreSQL database. Browser fixtures report no console or page errors. `test:all`, `test:database`, the explicit real-import command and `git diff --check` all return cleanly.

## Sprint 15 incremental synchronization

Sprint 15 introduces `stemforge.progressSync.v1`, explicit browser/account association, incremental durable push and owner-scoped exclusive-cursor pull. Local progress remains the active runtime and all learning writes finish before any network work. Pull uses deterministic V4 union inside a Web Lock or IndexedDB lease and advances its account-bound cursor only after local save and verification. Sign-out pauses association; account changes require new confirmation; browser reset cannot imply remote deletion.

## Sprint 16 account data and shared-device safety

Sprint 16 adds `stemforge.evidenceProvenance.v1` beside canonical V4 evidence. New records are conservatively classified as local anonymous, local associated, remote pull or legacy unknown without changing stable identity or storing account identity. Existing evidence becomes unknown rather than being guessed. Pull saves provenance before advancing a cursor.

The account page now owns explicit sync recovery, shared-device warnings, three separate browser-data scopes and two safe sign-out outcomes. Same-account remembered consent may resume; a different fingerprint stops transport and requires confirmation. Destructive actions suspend and await in-flight sync, use the established coordinated local transaction, verify writes and broadcast. Session 401s enter an auth-required state without losing evidence or creating retry storms.

Browser removal and path reset remain local only. PostgreSQL evidence is still append-only; there is no account erasure, remote deletion, tombstone or distributed reset. Read `STEM_FORGE_ACCOUNT_DATA_AND_SHARED_DEVICE_SAFETY.md` before changing these contracts.

The repository adds no migration. Per-owner PostgreSQL advisory locking closes receive-allocation/commit ordering races, and bounded reads include accepted evidence plus retained conflicts. The separate genuine Supabase synchronization path uses two isolated browser contexts and disposable PostgreSQL. See `STEM_FORGE_INCREMENTAL_PROGRESS_SYNC.md` for protocol, scheduling, failure and Sprint 16 account-safety boundaries.

## Important routes

- `/`
- `/dashboard`
- `/subjects`
- `/subjects/higher-maths`
- `/subjects/higher-maths/calculus`
- `/subjects/higher-maths/calculus/differentiation`
- `/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- `/subjects/higher-maths/calculus/integration/basic-integration` (coming-soon metadata route)
- `/question/hm-calc-diff-basic-f-001`
- `/question/hm-calc-diff-basic-a-001`
- `/question/hm-calc-diff-basic-ppq-001`
- `/subjects/higher-physics` (locked/coming soon)
- `/resources`

## Remaining vertical-slice assumptions

These are intentional product limits, not resolver defects:

- the homepage/dashboard retain an explicit current beta entry point because only Basic Differentiation is published;
- planned paths contain taxonomy metadata but no learner questions;
- the question-bank UI is minimally wired to the pure query contract and awaits a separately scoped dense-interface design;
- content import/review is still manual and no authoring system exists.

Future paths should be added through canonical data plus a single registry import, not by adding component-specific conditionals.

## Intentional limitations

- Optional account code, trusted owner mapping, confirmed import and opt-in incremental synchronization now exist; the feature remains disabled by default. There is still no distributed reset, analytics, payments, AI marking, CMS, or admin workflow.
- Active progress and completion acknowledgement remain browser-local; associated authenticated browsers converge by immutable evidence union while retaining their local copies.
- No live feedback form/service; the facilitator supplies the Markdown feedback template.
- Chromium desktop/mobile are automated; Safari, Firefox, screen-reader, and public deployment audits remain owner/future checks.
- No production multi-path bank or wider content bank has been added; the second-path proof is test-only.
- Client clocks remain untrusted event chronology; the remote repository records separate database-controlled receive time and order.
- The remote repository is reachable only through authenticated import/sync routes; owner-scoped cursor reads feed deterministic local evidence union.

## Verification commands

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run validate-content
pnpm run test:remote-evidence
pnpm run test:database
pnpm test
pnpm run build
pnpm run test:e2e:desktop
pnpm run test:e2e:mobile
pnpm run test:e2e
pnpm run test:e2e:import:real
pnpm run test:e2e:sync:real
pnpm run test:all
```

Do not weaken tests, add retries, or ignore application console errors to obtain a pass.

## Historical Sprint 10 decision gate after private beta

Do not begin Sprint 11 without tester evidence.

- Choose remote evidence/database foundations if students value the journey and local-only/cross-device progress is the material blocker, with ownership/privacy/retention/reset requirements understood.
- Choose generic multi-path infrastructure and controlled content import if learners mainly need more material and the hardcoded vertical slice is the scaling blocker.
- Choose focused learner-experience correction if product purpose, navigation, input, status language, mobile, or accessibility is confusing or blocking.

The owner must first verify the public deployment is accessible without login/protection, record the tested build/commit, provide the feedback template to testers, and review the collected feedback against `STEM_FORGE_PRIVATE_BETA_READINESS.md`.
