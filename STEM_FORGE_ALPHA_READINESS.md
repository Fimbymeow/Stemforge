# STEM Forge Alpha Readiness

Programme: 6 — Alpha Preparation and Real Learner Validation
Phase: 1, read-only audit — completed; production readiness gate — now closed
Updated: 30 July 2026

## 1. Repository and production evidence

Repository state confirmed at the start of Programme 6 Phase 1: branch `main`, HEAD `526a378f136b76f60684d3204f11f5effea4f019` ("Complete Programme 5 content import foundation"), `origin/main` aligned, working tree clean. The five settled programmes (Scalable Question Bank, Practice Sessions, Bounded Alpha Marking, Scheduled Review, Content Import Foundation) are each confirmed complete by their own commit titles immediately preceding HEAD. No real supplied-bank question import had occurred; no content approval or import receipt existed.

Production readiness was checked live against `https://stemforge-6an8.vercel.app`, not assumed from narrative documents:

- `GET /api/health` → `{"status":"ok","appVersion":"private-beta","buildCommit":"526a378f136b"}` — the deployed build matches repository HEAD.
- `GET /api/health/ready`, first check → `{"status":"not_ready","checks":{"application":"ok","configuration":"ok","authentication":"ok","database":"unavailable","migration":"unavailable","reporting":"unavailable"}}`.

Root cause: Vercel's `STEMFORGE_DATABASE_URL` held stale/incorrect Supabase Transaction Pooler credentials. It was replaced with the current pooler connection string and production was redeployed.

`GET /api/health/ready`, reconfirmed after the fix (independently re-checked, not only reported) → `{"status":"ready","checks":{"application":"ok","configuration":"ok","authentication":"ok","database":"ok","migration":"ok","reporting":"ok"}}`. The non-destructive `pnpm run test:production:smoke` suite (Chromium/Firefox/WebKit, no answer/report/account mutation) has passed against the production origin.

**Precision worth keeping:** `test:production:smoke` is the non-destructive suite only. The separate **credentialed authenticated production smoke** (real sign-in, refresh, owner mapping, one synthetic import, one synthetic sync cycle, one synthetic beta report, ordinary-user internal denial), documented as a distinct manual action in `STEM_FORGE_PRODUCTION_DEPLOYMENT_AND_RELEASE_VERIFICATION.md`, has not yet been separately reported as run. This is the one operational item still open — see §6 (entry criteria) and §9.

## 2. Current learner-journey audit (summary)

Every stage of the active vertical slice — landing, subject/path discovery, Basic Differentiation, question answering (malformed/incorrect/correct/hint-assisted/solution-assisted), completion/mastery language, Practice Sessions, scheduled Review — is implemented, tested, and matches its own documentation. This is a local-first, guest-capable journey with zero dependency on the production database; it was ready before the database fix and remains ready now.

Account creation/sign-in, explicit guest-progress import, opt-in cross-device synchronization, shared-device-safe sign-out, return on another device, and in-app feedback submission were all classified **requires operational confirmation** during the original audit, since each depends on the production database. That confirmation is now satisfied for the readiness-gate and non-destructive-smoke portion; the credentialed authenticated smoke pass (§1) remains the one narrower open item, scoped to Session B specifically (see `docs/alpha-session-b.md`).

Scheduled Review carries one fixed protocol constraint, not a defect: the first scheduled Review for a skill is due exactly two days after that skill's real completion instant (`docs/review-foundation.md`). Review cannot be exercised same-day, and must never be brought forward by editing clocks or data for a real learner session.

## 3. Alpha blockers and non-blockers

**No application code change is or was required.** The only blocker found (production database connectivity) was environment/infrastructure, not code, and is resolved. What remains:

- Credentialed authenticated production smoke pass — recommended before Session B, not blocking Programme 6 continuation overall.
- Exact Supabase Site URL / redirect URL allowlist — `authentication: "ok"` certifies configuration shape only; worth a quick confirmation, not a data-safety risk if wrong (a bad redirect fails safely).

Merely polish or technical debt, explicitly not Alpha blockers: thin content outside Basic Differentiation (already honestly disclosed in-product); the residual CSP/Edge-runtime items in `STEM_FORGE_PERFORMANCE_ACCESSIBILITY_SECURITY_RELIABILITY.md`; untested Safari/Firefox/physical-device/screen-reader combinations (the Alpha device/browser allocation plan exists specifically to close these with real participants, not more engineering).

Must wait for Alpha evidence, not pre-solved here: whether learners want cross-device continuity enough to justify further sync investment; whether Review's two-day delay reads as sensible or awkward; whether hint/worked-solution copy genuinely supports comprehension; content-breadth demand.

## 4. Alpha hypotheses

Ten falsifiable hypotheses, each with a required evidence source, pass/concern/failure signal, and session scope. No passive analytics is used anywhere — every signal is either directly observed by a facilitator or explicitly stated by the learner.

| # | Hypothesis | Session |
|---|---|---|
| H1 | Students understand what STEM Forge is within 30 seconds | A |
| H2 | Students reach a real question without coaching | A |
| H3 | Answer entry and feedback are understandable | A |
| H4 | Hints and worked solutions support rather than confuse | A |
| H5 | Progress and completion language (Completed/Secure/Mastered) is understood | A |
| H6 | Explicit account import is understood as a choice, not a requirement | B |
| H7 | Cross-device return works and is trusted | B |
| H8 | Students can identify what to do next at any point | A |
| H9 | Scheduled Review is discoverable and understood as purposeful, not arbitrary | C (requires a later return, ≥2 days) |
| H10 | Students can provide actionable feedback through the existing mechanism | Any |

Full evidence-required/pass/concern/failure definitions live in `docs/alpha-session-a.md`, `docs/alpha-session-b.md` and `docs/alpha-session-c.md`, one hypothesis reference per task card.

## 5. Severity and decision rubric

| Severity | Definition |
|---|---|
| Critical — Alpha blocker | Learner evidence lost, corrupted, shown to the wrong learner, or a core journey step cannot be completed at all |
| High | A step completes but produces a wrong or actively misleading result, or blocks one specific journey |
| Medium | Comprehension achieved only with difficulty, or a disclosed limitation is more confusing than expected |
| Low | Real but minor friction that doesn't change the outcome |
| Preference / non-finding | A like/dislike or feature request with no correctness or comprehension implication |

Decision rules:

- Testing must stop for a learner's remaining tasks the moment a Critical finding occurs, and for future sessions of that type once confirmed reproducible against a second learner.
- Immediate production rollback is required only when a Critical finding traces to a genuine live defect actively producing incorrect learner-facing results (wrong marking, corrupted evidence, cross-account leakage) — not merely a feature being temporarily unavailable, since guest learning remains safe to continue regardless.
- A blocker correction may be implemented between sessions only when narrowly scoped and not touching Marking, Review, Practice Session, or evidence-identity semantics without full review.
- Findings Medium and below are batched; only Critical and High interrupt the schedule.
- The same Medium-or-higher finding independently observed by **two or more** learners is the minimum bar before treating it as a real signal.
- Contradictory learner feedback is recorded as-is, without averaging or discarding; genuine contradictions on a Medium-or-above finding move to "insufficient evidence" (§7) rather than being decided by session count alone.

## 6. Entry criteria

Before Session A (any learner):

- `GET /api/health` returns `ok` with `buildCommit` matching the intended tested HEAD.
- `pnpm run test:e2e:hardening` and `pnpm run test:all` are green against that HEAD.
- Guest-only manual smoke of the exact route list in `docs/private-beta-checklist.md` performed fresh against the public origin.
- Facilitator materials prepared: `docs/alpha-session-a.md`, `docs/alpha-evidence-capture.md`, `docs/private-beta-feedback-template.md`.
- Participant consent process (`docs/alpha-recruitment-and-consent.md`) ready; first learner confirmed against recruitment/exclusion criteria.

Additionally, before Session B (any learner):

- `GET /api/health/ready` reports every category `ok`, checked the same day.
- A credentialed authenticated production smoke pass has been run at least once against the current HEAD and passed (see `docs/alpha-disposable-accounts.md`).
- At least one facilitator-provisioned disposable test account exists and has been dry-run through sign-up/sign-in once by the facilitator, not for the first time in front of a learner.

## 7. Exit criteria

| Outcome | Conditions |
|---|---|
| Alpha go | Production health `ok` across all six categories on the day of any Session B/C; guest journey passes for every recruited learner with no Critical and no repeated (2+) High findings; authenticated journey passes for every learner who attempted it; cross-device continuity (H7) confirmed trusted; Review timing/discoverability (H9) confirmed; mobile and accessibility participants complete with no Critical findings specific to their device/AT; feedback capture (H10) succeeds server-side for at least one real submission; no unresolved Critical or repeated High defect anywhere in the record. |
| Conditional go with bounded corrections | All of the above except one or more specific, narrowly-scoped High findings with a clear small fix. Proceed with remaining sessions only after that bounded fix is verified. |
| No-go | Any unresolved Critical finding; a repeated (2+ learner) High finding with no bounded fix available; production health cannot be brought to `ok` across the categories the attempted sessions require. |
| Insufficient evidence | Fewer than ~3 learners complete a given session type, or genuinely contradictory Medium-or-above findings exist with no clear majority signal — extend the schedule rather than force a decision. |

## 8. Remaining uncertainty

- Whether the production Supabase project is the same one already dev-verified in `STEM_FORGE_AUTHENTICATION_AND_OWNERSHIP.md`, or a separate, less-exercised production project.
- Exact Supabase Site URL / redirect URL allowlist (§1, §3).
- A full manual guest-journey click-through on the public origin beyond the two health-endpoint checks and existing automated hardening/smoke suites.
- Whether the participant pool can realistically supply an iOS Safari and a screen-reader/keyboard-only participant within the Alpha window (recruitment logistics, not technical).
- Whether the two-day Session C gap is operationally workable for actual facilitator availability.

## 9. Recommended next action

**Ready to prepare and run the Alpha testing package.** Production readiness is confirmed live and independently reconfirmed: all six `/api/health/ready` categories report `ok`, and the non-destructive production smoke suite passes. No application code change is required, and none was ever identified. Session A can begin as soon as the participant plan is in place. Session B should wait for the credentialed authenticated smoke pass (§1, §6) — a single dedicated-credential manual run of an already-documented procedure, not a code or infrastructure change — before the first learner is invited into it.

See `docs/alpha-facilitator-briefing.md` for the full facilitator asset index and how to use it.
