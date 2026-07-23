# STEM Forge — Sprint P7: Mobile and Accessible Learning

Phase II — Product Excellence, Sprint P7. Scope: make the complete STEM Forge learner journey genuinely usable on small mobile screens, touch devices, keyboard-only input, zoomed/reflowed layouts, screen readers, and reduced-motion environments — without becoming a visual redesign, a new navigation system, or a WCAG paperwork exercise. This sprint did not touch marking, progress, mastery, achievement, sync, import, or next-action semantics; every change here is presentational, structural, or interaction-layer.

## 1. Why this sprint, and what "done" means here

P2–P6 built and refined what the product says and how it acknowledges progress. None of that work was validated against how a real mobile/touch/keyboard/screen-reader user actually experiences it. "Done" for P7 is not a Lighthouse score — it's: does the skip link actually skip navigation when a keyboard user presses it, do the two floating mobile surfaces (beta notice, feedback dock) visually collide, does the sidebar nav fit at 320px without scrolling, can a screen reader construct a sane page outline, and are touch targets big enough to hit. Concrete barriers were prioritized over cosmetic polish, per the sprint's own instruction.

## 2. Audit method

Two passes, both already reported to the user before any code changed:
- **Code-level sweep** — grepped for landmark roles, heading levels, dialog/modal ARIA contracts, duplicate DOM ids, hover-only content reveals, fixed/sticky positioning, touch-target sizing, and `env(safe-area-inset-*)` usage across `components/` and `app/`.
- **Live browser testing** — real viewport resizes (320×568, 390×844, 640×800 as a 200%-zoom equivalent), keyboard-only navigation, `prefers-reduced-motion`, and manual contrast computation on flagged text/background pairs, using the in-app browser tooling (not a static linter).

## 3. Severity inventory going in

| Issue | Severity | Root cause |
|---|---|---|
| Beta notice and feedback dock visually overlap at small viewports | High | Both independently hardcoded `bottom-20` |
| Sidebar nav only reachable via horizontal scroll under `xl` breakpoint | High | `max-xl:flex-none` + `overflow-x-auto` with 4 fixed-width items wider than 320px |
| Skip link's target was a wrapper `div` that was an *ancestor* of both nav and main, not `<main>` itself | High | `#main-content` lived one level too high in the tree, before nav in effective tab order |
| Two destructive account dialogs claim `role="alertdialog"`/`aria-modal="true"` without real focus containment | High | Focus trap was implemented once, inline, only in `ReportDialog` — never extracted or reused |
| Several dismiss/close controls sized below the 40px mobile touch-target floor already established elsewhere in the app | Medium | Inconsistent application of the app's own `min-h-10`/`min-h-11` convention |
| "Common mistake" callout text failed WCAG AA contrast (4.47:1 against a 4.5:1 requirement) | Medium | `text-muted` on a light `forge-soft` tint |
| Landing/footer `<nav>` elements had no distinguishing `aria-label`, ambiguous to screen-reader users when multiple navs exist on one page | Low | Never added when those components were built |

Audited and found **not** to need fixes (explicitly avoiding scope creep): the math keypad is already correctly sized and non-adaptive-in-a-bad-way; no hover-only content-reveal patterns exist anywhere in the app; icon-only buttons already carry `aria-label`s; heading hierarchy and single-`<main>`-per-page were already correct on every route checked.

## 4. Fix 1 — beta notice / feedback dock collision

`components/beta-notice.tsx` and `components/beta-reports/global-report-dock.tsx` each independently pinned themselves to the bottom of the viewport. Fixed by removing per-component fixed positioning and introducing a single bottom-anchored flex stack in `components/layout/app-shell.tsx` that owns both, in order, with `env(safe-area-inset-bottom)` padding so neither surface sits under an iOS/Android home-indicator gesture bar. This is architecturally cleaner than offset-patching two independent `bottom-20`s and adds safe-area handling for free. Verified with a Playwright bounding-box intersection check at 320×568 (`e2e/mobile.spec.ts`) and confirmed neither surface's box intersects the question-answer input's box either.

## 5. Fix 2 — sidebar nav horizontal-scroll trap

`components/layout/app-sidebar.tsx`'s mobile nav used `overflow-x-auto` over four fixed-width items that didn't fit in 320px, meaning the fourth item ("Account") was only reachable by scrolling a nav bar sideways — an unconventional, easy-to-miss gesture. Fixed with `max-xl:flex max-xl:gap-1` and `flex-1` equal-share items plus shortened mobile labels (`shortLabel` added to the nav-item tuples), which guarantees every item fits at any width down to 320px rather than shortening text and hoping it's enough. Added `aria-label="Main"` to the `<nav>` itself. Verified: a Playwright test asserts every nav link's bounding box stays within `[0, 320]` horizontally at 320×568, and that the nav's own box never exceeds 320px wide.

## 6. Fix 3 — skip link that didn't actually skip

The most significant structural bug found. `id="main-content"`/`tabIndex={-1}` lived on a wrapper `<div>` in `app/layout.tsx` that was an *ancestor* of both the sidebar nav and the main content — so activating the skip link moved focus to a container positioned *before* the nav in the render tree, meaning the very next Tab press landed back in navigation. The skip link satisfied an automated "does `#main-content` exist and receive focus" check while completely failing its actual purpose.

Fixed by removing that wrapper and moving `id="main-content"`/`tabIndex={-1}` onto the real `<main>` landmark, positioned after nav in DOM order, across every shell and terminal-state component that renders its own main: `components/layout/page-container.tsx`, `app/page.tsx` (landing), `components/account/account-shell.tsx`, `app/not-found.tsx`, `app/error.tsx`, `components/recovery/route-error.tsx`, and the completed-session standalone view in `components/practice/practice-session.tsx`.

Verified two ways in `e2e/platform-hardening.spec.ts`, run across real Chromium, Firefox, and WebKit engines: (1) the existing check that `#main-content` receives focus after Enter still passes, and (2) a new check proving the *actual* behavior — that the next Tab press never lands back inside `nav[aria-label="Primary"]`. On WebKit specifically, the stronger "next Tab lands inside `<main>`" assertion is intentionally skipped: real Safari without "Full Keyboard Access" enabled only tabs to form controls, not links, so a link-first main content area legitimately isn't reached by Tab there — this was confirmed by direct inspection (Tab moves to `<body>`, not back into nav), which is correct, standards-compliant WebKit behavior, not a bug.

## 7. Fix 4 — shared modal focus-trap hook

`ReportDialog` already had a correct, working focus trap (initial focus, Tab/Shift+Tab containment, Escape-to-close, focus-return-to-trigger) implemented inline. Two destructive account confirmation dialogs — `components/account/account-data-controls.tsx` (data export/erasure) and `components/account/safe-sign-out.tsx` — declared `role="alertdialog"` and `aria-modal="true"` without any of that behavior actually implemented, which is worse than not claiming the role at all: it tells assistive technology to expect containment that doesn't exist.

Extracted the trap logic into `lib/use-modal-focus-trap.ts` (`useModalFocusTrap({ open, containerRef, initialFocusRef, triggerRef, onClose })`) and wired all three dialogs through it. `ReportDialog` was refactored to use the shared hook rather than its own inline copy, which means every one of the hook's behaviors is exercised by the already-passing `ReportDialog` e2e coverage — including a new assertion added this sprint that Shift+Tab from the first focusable element (the close button) wraps to the dialog's *last* focusable element (the contact-email field) rather than escaping into the page behind it, proving the trap actually traps in both directions, across all three browser engines.

## 8. Fix 5 — touch targets and contrast

Bumped several controls below the app's own established 40px floor up to `min-h-10 min-w-10` (grid/place-items-center): the beta-notice dismiss button, the `ReportDialog` close button, and the `MasteryUpgradeBanner` dismiss button (`components/learning/local-skill-path-progress.tsx`). Added `min-h-10` to the two `<summary>` disclosure toggles in `components/questions/question-workspace.tsx` ("More context", "Question details"), which were tap targets with no explicit minimum height. Fixed the "Common mistake" callout in `components/learning/worked-examples-section.tsx` from `text-muted` (measured 4.47:1, failing the 4.5:1 AA threshold) to `text-ink` (computed ≈14.7:1 against its `forge-soft` background using the sRGB relative-luminance formula — comfortably AAA). Added `aria-label="Primary"` to the landing navbar and `aria-label="Footer"` to the landing footer nav, disambiguating them for screen-reader users navigating by landmark.

## 9. Deliverable coverage — mobile app shell

Verified at 320×568 and 390×844: nav fits without horizontal scroll, all four nav items are individually reachable and stay within the viewport, the bottom-anchored beta-notice/feedback-dock stack never overlaps page content or each other, and `document.documentElement.scrollWidth === clientWidth` (zero horizontal overflow) on dashboard, subjects, question, path, and account routes.

## 10. Deliverable coverage — question workspace on mobile

The question and answer input reach above the fold on a 390×844 viewport (measured bounding-box `y < 700`). The optional keypad's buttons measure 40×50px (meets the touch-target floor). Feedback after submission stays within the visible/scrolled viewport. Breadcrumb and "More context"/"Question details" disclosures wrap cleanly at 320px with no overflow.

## 11. Deliverable coverage — mobile practice journey

`e2e/mobile.spec.ts` already exercised the full guest mobile journey (dashboard → subject → path → question → answer → next question) before this sprint; re-verified passing after every P7 structural change, plus three new tests added this sprint (collision check, nav-overflow check, touch-target check).

## 12. Deliverable coverage — dashboard/progress on mobile

Dashboard progress summary, course progress, and quick links render without overflow at 320px; heading structure (`Course progress`, `Recent activity`, `Needs work`, `Secure and mastered`) correctly appears/disappears based on guest evidence state, matching desktop semantics exactly — P7 did not change when or why these render, only how they fit.

## 13. Deliverable coverage — account/import/sync accessibility

`AccountDataControls` and `SafeSignOut` now route through the shared, tested focus-trap hook (Fix 4). **Honest limitation**: neither component is reachable in this environment's ordinary e2e suite — both require real Supabase authentication (`accountFingerprint` / `ownerState !== "unauthenticated"`), and the auth-enabled test project only exercises a lightweight navigation-rendering smoke test, not these specific dialogs. Confidence here rests on shared, already-tested code (not duplicated, unverified logic) plus typecheck and structural review — not a live e2e run of these two components specifically. This is the same honesty pattern P5/P6 used for real-auth-unavailable gaps.

## 14. Deliverable coverage — landmarks, headings, page structure

Accessibility-tree inspection (not just DOM inspection) on the dashboard and the 404 page confirms: skip link first, `complementary` (sidebar) containing `navigation "Main"`, then a single `main` landmark with a sane `banner`/`region`/heading nesting. No duplicate landmark roles observed on any route checked. Heading hierarchy was already correct pre-sprint; not modified.

## 15. Deliverable coverage — keyboard-only journey

Skip link receives a visible focus outline (`outline-style: solid`) and becomes visually present in the top-left corner when focused, confirmed by direct focus + screenshot. Full skip-link → main → nav-negative-check → dialog-trap-wrap keyboard sequence is proven by `e2e/platform-hardening.spec.ts`'s real keyboard-driven Playwright test, run against genuine Chromium, Firefox, and WebKit engines (not simulated/mocked input) — this is the authoritative evidence for this deliverable; a supplementary manual pass in the interactive browser tool hit a known tool-level quirk where raw synthetic Tab key events don't reliably advance focus the way a real browser does, so that manual pass was used only for visual focus-ring confirmation, not as primary keyboard-order evidence.

## 16. Deliverable coverage — screen-reader interaction

**No real assistive-technology testing was performed.** This sprint verified accessibility-tree structure (landmark roles, heading levels, accessible names, `aria-*` contracts) via automated tooling and direct tree inspection, which is a reasonable proxy for how a screen reader would construct its navigation model, but it is not the same as testing with VoiceOver, NVDA, JAWS, or TalkBack. Do not read this sprint's completion as "screen-reader validated" — read it as "screen-reader-structure validated by tree inspection, real AT unavailable in this environment."

## 17. Deliverable coverage — zoom, reflow, text resizing

Tested at 320px width (WCAG 1.4.10's 400%-zoom-equivalent reference width on a 1280px baseline) and 640px width (200%-zoom-equivalent) on the dashboard, subjects, question, path, account, and formula-cards pages. Zero horizontal overflow (`scrollWidth === clientWidth`) at both widths on every page checked, including the formula-cards page specifically chosen for content density.

## 18. Deliverable coverage — colour, contrast, non-colour meaning

Fixed the one confirmed AA contrast failure (Fix 5). Mastery/status states were already confirmed (in prior sprints) to carry text labels alongside color, not color alone. No new colour-only meaning was introduced this sprint.

## 19. Deliverable coverage — touch targets and pointer behaviour

Covered in Fix 5. No hover-only interactions exist anywhere in the app (confirmed by audit); nothing required fixing on that front.

## 20. Deliverable coverage — reduced motion and animation safety

P7 introduced no new animation. Existing reduced-motion handling from P6 (`app/globals.css`, `components/questions/question-workspace.tsx`, exercised by `e2e/stage-and-accomplishment-experience.spec.ts` and `e2e/completion-experience.spec.ts`) continues to pass unmodified, confirming P7's structural changes didn't regress it.

## 21. Deliverable coverage — error, loading, offline-like states

The 404 page (`app/not-found.tsx`) and generic error boundary (`app/error.tsx`, `components/recovery/route-error.tsx`) now carry the corrected skip-link target alongside their existing single-`main`/heading structure; verified via accessibility-tree inspection that the 404 page in particular presents a clean landmark structure with working recovery links.

## 22. Deliverable coverage — real browser/device hardening

`e2e/platform-hardening.spec.ts` runs one comprehensive guest-journey test across real Chromium, Firefox, and WebKit engines via `playwright.hardening.config.ts` (not just Chromium-with-a-mobile-viewport). This sprint extended that single test with the skip-link negative-check, nav landmark-label checks, and the modal focus-trap backward-wrap check described above. **No real physical device coverage was performed** — all testing used Playwright's browser-engine emulation (including WebKit, which is genuine WebKit, not Safari-branded Chromium) and the in-app browser tool's viewport resizing. Do not read "cross-browser" as "cross-device"; iOS Safari, real Android Chrome, and real assistive-technology-paired devices were not tested.

## 23. What P7 deliberately did not do

No global visual redesign. No new navigation system or information architecture. No content hidden or shortened to fit mobile (nav labels were shortened, not removed — all four destinations remain individually reachable and labeled). No changes to marking, progress, mastery, achievement, sync, import, or next-action logic. No new animation. No streaks/gamification (that boundary was already set in P6 and holds).

## 24. Pre-existing verification-gate issue found, then fixed (narrowly scoped, post-sprint correction)

The full verification gate initially surfaced one e2e failure unrelated to any P7 mobile/accessibility change: `e2e/dashboard.spec.ts`'s "grouped recent activity" test seeded two attempts with hardcoded absolute timestamps (`2026-07-16T10:00`/`10:05`), and `lib/dashboard-derivations.ts`'s 7-day rolling-activity window is measured against the real browser clock (`new Date()`), so once enough real time passed the fixed fixture dates fell outside that window — a permanent test-fixture time bomb, not a flaky/intermittent failure, confirmed deterministic and isolated to that single test.

This was corrected as a narrowly scoped verification-maintenance fix, approved separately from the rest of P7's mobile/accessibility work: `e2e/dashboard.spec.ts`'s second test now calls `page.clock.setFixedTime(new Date("2026-07-16T12:00:00.000Z"))` before seeding progress, freezing the browser's clock to an instant compatible with the fixture's existing attempt timestamps. This is the smallest possible fix — one added line in one test file, zero changes to the shared fixture module (`e2e/fixtures/progress.ts`, used by many other tests), zero changes to `lib/dashboard-derivations.ts` or any other production code, and the 7-day rolling-window *logic itself* is untouched and still exercised for real: the assertion still depends on the two seeded attempts landing inside a real, unmodified 7-day-window calculation relative to a controlled "now," it's just no longer at the mercy of the real calendar date the suite happens to run on. The assertion text and behavior (`"1 active day in the last 7 days"`) were not weakened.

Re-run in isolation and as part of the full ordinary e2e suite: **90/90 passing**, zero failures, zero skips.

## 25. Files touched this sprint

New: `lib/use-modal-focus-trap.ts`.
Modified: `components/beta-notice.tsx`, `components/beta-reports/global-report-dock.tsx`, `components/layout/app-shell.tsx`, `components/layout/app-sidebar.tsx`, `app/layout.tsx`, `components/layout/page-container.tsx`, `app/page.tsx`, `components/account/account-shell.tsx`, `app/not-found.tsx`, `app/error.tsx`, `components/recovery/route-error.tsx`, `components/practice/practice-session.tsx`, `components/beta-reports/report-dialog.tsx`, `components/account/account-data-controls.tsx`, `components/account/safe-sign-out.tsx`, `components/learning/local-skill-path-progress.tsx`, `components/questions/question-workspace.tsx`, `components/landing/navbar.tsx`, `components/landing/footer.tsx`, `components/learning/worked-examples-section.tsx`, `e2e/mobile.spec.ts`, `e2e/platform-hardening.spec.ts`, `e2e/dashboard.spec.ts`, `.gitignore` (added `test-results-hardening` to the ignore list, matching the pattern already used for the other suite-specific `test-results-*` directories).
