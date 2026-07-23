# STEM Forge Product Excellence P10

Phase II — Product Excellence, Sprint P10. Baseline: `69d5f2e` (`Complete Sprint P9 account confidence`). Scope: targeted presentation and interaction polish only. P2–P9 learning, progress, practice, resource, account, authentication, import, synchronization, ownership, accessibility, and next-action semantics remain unchanged.

## 1. Reproduced audit findings

- At 390×844 the fixed private-beta notice intersected the dashboard next-action hero by approximately 86px.
- At 1440×900 the same fixed notice intersected visible incorrect-answer feedback.
- Opening Question Bank filters at 1440×900 produced a 615px-tall disclosure; the first direct question action began at 1000px, outside the viewport.
- The Higher Maths roadmap scroller had exactly 57px of unnecessary internal overflow at 1440×900.
- A completed Practice session discarded the app shell, brand, main navigation, and account context.
- Account primary actions used uppercase transformation and a 6px radius rather than the established sentence-case, 8px product treatment.
- Not-found recovery had no brand treatment and rendered a 68px heading.
- Two question surfaces hand-authored nearly identical low-elevation shadows instead of using `shadow-card`.
- Four SVG product mockups retained the obsolete orange accent.

## 2. Findings deliberately not implemented

No concrete low-content rhythm defect was reproduced. Empty space was not filled with decoration, cards, footers, or invented actions. The PNG header logo was not recoloured because no trustworthy vector or editable source exists in the repository.

## 3. Shell decision

Completed Practice summaries now remain in the normal `AppShell`. This restores the same navigation and account context as the active session without adding a competing page action; exact-session retry remains dominant when incorrect answers exist.

Account and recovery routes remain focused and do not gain the learning sidebar. `FocusedProductShell` shares only page background, responsive gutters, brand/home treatment, maximum width, top spacing, and the real `main` landmark across account, not-found, and error recovery surfaces.

## 4. Beta-notice positioning

The private-beta notice moved from a fixed bottom stack into normal `AppShell` content flow. The feedback dock remains independently fixed with its established safe-area inset. This guarantees that the notice cannot cover question feedback, dashboard content, answer controls, or the feedback dock without route-specific offsets, clipping, z-index tricks, or hidden content.

## 5. Question Bank filter strategy

The existing native `details` disclosure remains. When open on desktop it expands to a bounded 640px layout with a two-column control grid, tighter vertical gaps, and preserved native controls. Search remains full width; progress, stage, and sort remain keyboard-operable. No modal, portal, sheet, focus trap, scroll lock, or new state system was added.

## 6. Roadmap responsive strategy

At the established desktop breakpoint, roadmap nodes narrow from 108px to 102px and connectors from 32px to 28px. This removes the 57px near miss at 1440px without reducing touch height, hiding steps, or preventing future overflow. Below the breakpoint the original widths remain, so intentional horizontal scrolling is preserved at narrow widths and zoom.

## 7. Account product-register consistency

Existing account action classes were corrected directly. Buttons and button-like links now use sentence case and `rounded-lg` while retaining their labels, hierarchy, pending states, accessible names, form actions, confirmation behavior, focus handling, and all P9 copy. No shared Button primitive or broad migration was introduced.

## 8. Visual and brand consolidation

The two question-card shadows now use the existing `shadow-card` token; visual comparison showed no meaningful hierarchy change. Obsolete orange accents in the dashboard, learning-path, worked-solution, and progress mockups changed to canonical `forge` navy, with old accent-tint backgrounds changed to `forge-soft` or `paper`. Green success and the neutral illustrated “not started” colour remain semantic and unchanged.

The raster header logo remains unchanged. Replacing its orange mark requires an externally supplied trustworthy vector/editable asset.

## 9. Accessibility and responsive geometry

All affected shells retain one focusable `main` landmark, one page heading, the global skip link, keyboard-operable actions, and existing focus behavior. Automated coverage checks notice/content non-intersection, direct-question visibility, Practice summary navigation, account computed styles, desktop and narrow roadmap behavior, 320px/390px document geometry, hydration, and browser console/page errors.

## 10. Test coverage

- `e2e/final-product-polish.spec.ts` covers beta geometry, filter visibility, Practice summary shell/priority, roadmap behavior, recovery semantics, skip-link focus, mobile overflow, and console cleanliness.
- `e2e/auth-enabled-navigation.spec.ts` now verifies computed sentence-case and 8px-radius presentation on sign-in, sign-up, and recovery actions.
- `tests/product-polish.test.ts` prevents account-domain uppercase/`rounded-md` regressions and obsolete orange mockup accents.

## 11. Manual validation

Manual Chromium validation confirmed:

- dashboard notice and hero are separated at 390×844;
- question notice and feedback are separated at 1440×900;
- the open Question Bank disclosure ends at 748px and the first direct action remains visible at 815–859px;
- roadmap overflow is 0px at 1440px and 787px internally at 390px, with 0px document overflow;
- Practice summary has brand, navigation, one main landmark, and no mobile overflow;
- not-found recovery has brand, one main, a 32px mobile heading, a working skip target, and no overflow;
- sign-in renders sentence case with an 8px radius;
- all four edited SVGs render successfully without the obsolete orange accent.

## 12. Verification evidence

The complete safe gate returns a clean exit:

- type checking, linting, content validation, and the production build pass;
- 322/322 aggregate unit and integration tests pass;
- 103/103 ordinary Playwright tests pass;
- 5/5 authentication-enabled Playwright tests pass;
- the P7 platform-hardening journey passes independently in Chromium, Firefox, and WebKit;
- focused P10 Playwright passes 5/5;
- `git diff --check`, secret scanning, and generated-artifact review are clean.

The first aggregate run caught one genuine presentation regression: the in-flow notice moved the first Formula Card 18px beyond its established mobile content-priority boundary. The assertion was preserved. Compact mobile notice spacing fixed the shared cause, the focused route passed, and the complete gate was rerun successfully.

## 13. Remaining beta-feedback candidates

Physical-device and paired assistive-technology testing remain external activities. Low-content rhythm should be evaluated with real student feedback rather than filled speculatively. A trustworthy editable logo source remains an external design-asset dependency.
