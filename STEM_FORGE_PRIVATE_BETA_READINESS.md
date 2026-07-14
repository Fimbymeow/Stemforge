# STEM Forge Private Beta Readiness

Assessment date: 14 July 2026  
Starting commit: `d515ca2`  
Decision: **Conditionally ready for a small private beta**

## 1. Scope of the private beta

The beta exercises the structured learner journey **Higher Maths -> Calculus -> Differentiation -> Basic differentiation**. It validates discovery, question interaction, support, local progress, completion/mastery language, reset, recovery, responsive behavior, and the tester handoff. It does not validate a broad content catalogue, accounts, remote persistence, or migrated Higher Physics.

## 2. Exact active course, path, and question count

- 2 visible subjects and 4 course records exist.
- 8 skill paths are structurally active, but **1 path is learner-ready and in beta scope**: Basic differentiation.
- That learner-ready path contains **8 active canonical questions** across Foundations (3), Applications (3), and Past Paper-style Questions (2).
- 15 Higher Physics questions remain in the separate read-only legacy schema and are not beta learning content.

## 3. Supported browsers and viewports tested

- Automated and manual desktop Chromium at 1440 x 900.
- Automated and manual mobile Chromium at 390 x 844.
- Keyboard submission and reduced-motion behavior are covered in desktop Chromium.
- Safari, Firefox, physical iOS/Android devices, and screen-reader combinations are not yet claimed as supported evidence.

## 4. Automated verification results

The lockfile install was already consistent. TypeScript and ESLint passed. Content validation passed with 0 errors and the one expected warning for the 15 legacy Physics questions. The unit/integration suite passed 124/124. The production build passed and generated 22 application routes. Chromium genuinely launched: desktop passed 39/39, mobile passed 2/2, and the combined Playwright suite passed 41/41 with one worker and zero retries. The aggregate `pnpm run test:all` command also passed with the same counts.

## 5. Manual QA performed

The application was exercised in the in-app Chromium browser on a production build. Checks covered homepage clarity, dashboard entry, subject and path discovery, empty state, incorrect answer, hint-assisted correct answer, gated worked solution, continued navigation, dashboard persistence after refresh, locked Physics recovery, invalid-route recovery, desktop layout, and 390 x 844 layout. No unexpected page-level horizontal overflow was found on the core routes. The roadmap on the Higher Maths hub intentionally uses its existing bounded horizontal scroller on narrow screens.

## 6. Core learner journeys verified

- Fresh visitor can understand the bounded beta and reach the first Basic differentiation question.
- Empty answers remain disabled and create no evidence.
- Independent, incorrect, hint-assisted, and solution-assisted flows retain their established outcomes.
- Worked solutions remain gated behind a genuine attempt.
- Question navigation, stage progression, completion variants, dashboard/hub/path consistency, refresh, revisit, and reset are covered.
- Completed, Secure, Mastered, and Review Recommended remain distinct and data-driven.
- Malformed, legacy, and unsupported-future storage behavior remains covered by regression tests.
- Locked Higher Physics and invalid routes give valid recovery actions.

## 7. V4 progress guarantees preserved

The progress storage key is unchanged and canonical writes remain V4. Attempts, support events, and achievement snapshots retain stable identities. Current readiness remains derived from active content, current question versions, and current-version evidence. Historical snapshots remain immutable history, are not invented during migration, and survive path reset. Evidence merging remains deterministic, immutable, idempotent, commutative, and associative. Completion acknowledgement remains separate in `stemforge.pathCelebration.v1` and does not determine progress truth.

## 8. Accessibility and responsive findings

The locked Physics page now has a page-level heading and an explicit recovery action. Answer entry is submitted through a semantic form, so Enter invokes the same existing submission handler as the visible button; empty and already-submitted states remain disabled. Existing accessible answer labels, status announcements, progress-bar semantics, reduced-motion handling, and mobile keypad behavior remain covered. Automated and manual checks found no core-page horizontal overflow at 390 x 844. Formal contrast measurement, screen-reader testing, and full keyboard traversal on multiple browser engines remain future owner/specialist checks.

## 9. Issues found and fixed

1. The homepage and feature copy overstated the breadth of available learning and did not clearly disclose local-only progress. Copy now names the structured Scottish SQA purpose, the one learner-ready path, the four-step learning loop, no-account state, and browser-local persistence.
2. Feedback actions pointed to `#`, producing dead controls. They were replaced with honest facilitator/template instructions and the unused placeholder module was removed.
3. The locked Higher Physics page lacked a page-level heading and sufficiently explicit beta status. It now states that learning paths are unavailable in this beta and offers a valid Higher Maths action.
4. Pressing Enter in the answer field did not submit. The answer area is now a semantic form using the existing submission boundary, protected by a browser regression.
5. The durable handoff and several current architecture documents contained stale V2/V3-era instructions. They were reconciled to the V4 source of truth without rewriting clearly historical sprint evidence.

## 10. Known limitations

- Progress and completion acknowledgement are local to one browser/device; clearing browser data loses the active local record.
- There are no accounts, database, sync, analytics, payments, AI marking, CMS, or admin workflows.
- No live feedback service is embedded; the facilitator supplies the Markdown feedback template.
- Basic differentiation is the only learner-ready path. Wider subjects and paths are coming soon.
- Higher Physics is a locked/read-only legacy demonstration.
- Browser evidence is Chromium-only; public-host behavior and real-device/accessibility combinations remain owner checks.

## 11. Remaining hardcoded vertical-slice assumptions

Global active subject/path constants select Higher Maths and Basic differentiation; shared lookup imports the Higher Maths differentiation questions directly; question breadcrumbs and the badge assume Higher Maths/Calculus/Differentiation; some Higher Maths hub/resource links are fixed; and question position is global across the Maths set rather than fully path-scoped. These are preconditions for controlled multi-path work, not defects in the current beta slice.

## 12. Deployment checks still requiring the owner

The owner must deploy the tested code, set `NEXT_PUBLIC_SITE_URL` to the final public URL, record the deployed build/commit, and verify on the public origin that HTTPS works without login or deployment protection. The owner must also repeat the first-question smoke journey, refresh persistence check, mobile check on at least one real device where practical, and confirm the feedback collection channel. No public URL or deployment credentials were available during this sprint.

## 13. Tester instructions

Give each facilitator a copy of `docs/private-beta-checklist.md`, the public URL, the deployed build/commit, and `docs/private-beta-feedback-template.md`. Ask testers to begin with a fresh browser profile, think aloud, attempt the journey without coaching, and avoid opening developer tools. Facilitators should record observed behavior separately from tester interpretation and explain only after the unassisted portion that progress is local to the current browser.

## 14. Feedback evaluation criteria

Review whether testers understand the product within 30 seconds, reach the first question unaided, can enter and submit answers, find hints/solutions useful, distinguish Completed/Secure/Mastered, understand local progress, and encounter any blocking mobile/accessibility defect. Group findings by frequency and severity. A blocker affecting discovery or answer submission outweighs preferences; repeated demand for more material or cross-device progress should drive the architecture decision rather than isolated requests.

## 15. Go/no-go decision

**CONDITIONAL GO.** The repository and localhost production build are ready for a small, facilitated private beta. Release only after the owner completes the public deployment/access smoke check and distributes a concrete feedback channel/template. Do not describe the product as generally released or claim non-Chromium support from this evidence.

## 16. Conditions for choosing the next sprint

Do not preselect Sprint 11 before reviewing real tester evidence.

### Candidate A — Remote evidence/database foundation

Choose this if students value the core journey, local-only progress is a meaningful limitation, account/cross-device demand is evidenced, and ownership, privacy, retention, and reset requirements are sufficiently understood.

### Candidate B — Generic multi-path infrastructure and controlled content import

Choose this if the core journey works, students mainly want more learning material, account absence is not the main blocker, and the hardcoded path/question context is the principal scaling constraint.

### Candidate C — Focused learner-experience correction

Choose this if students cannot understand the product, navigation or question interaction is confusing, completion/mastery language is unclear, or mobile/accessibility problems block use.
