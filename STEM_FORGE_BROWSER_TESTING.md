# STEM Forge Browser Testing

Updated: 12 July 2026

## 1. Framework

The browser regression suite uses Playwright Test with Chromium. It was selected because the repository had no E2E framework and Playwright provides Next.js server orchestration, isolated browser contexts, desktop/mobile projects, LocalStorage control, accessible locators, and failure traces in one maintained development dependency.

## 2. Installation

```powershell
pnpm install
pnpm exec playwright install chromium
```

No external service, account, database, or network connection is used while tests run.

## 3. Configuration

`playwright.config.ts` owns the base URL, projects, server, artifacts, and retry policy. Tests live in `e2e/`; reusable actions and progress fixtures live in `e2e/fixtures/`.

## 4. Commands

```powershell
pnpm run test:e2e
pnpm run test:e2e:desktop
pnpm run test:e2e:mobile
pnpm run test:e2e:completion
pnpm run test:e2e:ui
pnpm run test:all
```

`pnpm test` remains the fast unit/integration suite. `test:all` adds typechecking, linting, and browser tests.

## 5. Test server

Playwright runs `pnpm run build` and starts the production server on `127.0.0.1:3070`. It does not reuse an existing server, which prevents stale development output from influencing results.

## 6. Projects and viewports

- `desktop-chromium`: 1440 x 900, all non-mobile specs.
- `mobile-chromium`: 390 x 844, the focused mobile interaction spec.

Workers are limited to one and retries are zero. Deterministic failures are therefore visible rather than hidden by retries.

## 7. Storage isolation and seeding

Every Playwright test gets a fresh browser context. `seedStoredProgress` first opens the local origin, writes once to the production key `stemforge.localProgress.v1`, and then lets the test navigate normally. Completion tests use the same pattern for the separate `stemforge.pathCelebration.v1` acknowledgement key. Fixtures do not install a repeating init script, so refresh and reset behavior remain genuine.

## 8. Progress fixtures

Fixtures create real V3 known-version attempts/support events, V2 payloads for conservative migration, V1 payloads, and unversioned arrays using production IDs and payload types. Browser tests read storage only when verifying persistence, migration, evidence scope, best outcome, or non-destructive behavior.

## 9. Selector strategy

Tests prefer headings, labels, roles, link names, and button names. The few test IDs cover durable product states: question feedback, hint, solution, next/locked progression, dashboard summary, path status, and reset. No CSS class or element-order assertions are used as product contracts.

## 10. Accessibility strategy

The answer input now has an accessible name. Progress bars expose `progressbar`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`. These changes improve keyboard/screen-reader semantics and stable testing without visual changes.

## 11. Console-error policy

Uncaught page errors and console errors fail every test. The only ignored browser message is Chromium's expected generic “Failed to load resource” line for an intentionally requested 404 route. The 404 response and rendered recovery page are asserted separately. No application error is ignored.

## 12. Test groups

- navigation and 404 recovery;
- answer submission and support transitions;
- cross-page consistency and reset;
- V2/V1/unversioned migration, version evidence, and corrupted/future storage;
- completion variants, replay prevention, mastery upgrades and acknowledgement storage safety;
- full mobile interaction and overflow.

## 13. Covered journeys

Coverage includes fresh navigation, blank input, unresolved incorrect answers, independent correctness, hints, worked solutions, reattempts, strongest-outcome preservation, next/previous/end-of-path navigation, dashboard/hub/path consistency, path reset, migration, corruption, unsupported versions, completion/replay/mastery-upgrade acknowledgement, reduced motion, and mobile progression.

Completion-specific storage, reset, accessibility and future-version rules are documented in `STEM_FORGE_COMPLETION_EXPERIENCE.md`.

## 14. Known gaps

The suite does not cover legacy Physics interaction because Physics is intentionally read-only. It does not cover multiple-choice or multi-field UI because active Higher Maths content has none. Cross-browser Safari/Firefox behavior, visual pixel diffs, performance budgets, and assistive-technology audits are deferred.

## 15. Debugging

Use the terminal error context first. Failure artifacts appear in `test-results/`. Open a retained trace with:

```powershell
pnpm exec playwright show-trace <trace.zip>
```

Use `pnpm run test:e2e:ui` for an interactive local run.

## 16. Artifacts

Screenshots are captured on failure. Videos and traces are retained on failure. The HTML report is written to `playwright-report/`. All artifact directories are ignored by Git.

## 17. CI readiness

Recommended future sequence: install -> install Chromium -> typecheck -> lint -> content validation -> unit/integration tests -> production build/browser tests. Browser installation should be cached by the CI platform where practical.

## 18. Performance

The production build dominates suite time. Browser tests share one server per command and run serially for stability. Keep focused tests direct-route based; reserve multi-page navigation for the two complete journeys.

## 19. Maintenance rules

Assert student-visible contracts, not layout internals. Reuse content IDs and fixtures. Keep each test context independent. Do not weaken console checks or add retries to mask failures. Update fixtures when the canonical payload version deliberately changes.

## 20. When to add a regression test

Add a browser test when a change affects navigation, rendered answer interaction, persistence, progression, support gating, migration, reset, responsive usability, or an accessibility-critical control. Pure calculation branches should remain unit tested unless they also alter the rendered journey.
