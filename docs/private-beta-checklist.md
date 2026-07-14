# STEM Forge Private-Beta Checklist

Use one copy per test session. The facilitator should supply the public beta URL and `private-beta-feedback-template.md`; testers need no repository access.

## Session record

- Date/time:
- Tester/session ID (avoid unnecessary personal data):
- Device:
- Operating system:
- Browser and version:
- Viewport/screen size:
- Build/commit:
- Public URL:
- Result: PASS / PARTIAL / BLOCKED / FAIL
- Notes/issues:

## Owner preflight

- [ ] Record the deployed build/commit above.
- [ ] Confirm the URL opens in a private window without Vercel login, deployment protection, account, or invite flow.
- [ ] Confirm HTTPS and page assets load without mixed-content warnings.
- [ ] Provide this checklist and the feedback template to the tester.
- [ ] Explain that progress stays on this browser/device and should not contain sensitive information.
- [ ] Confirm Higher Maths Basic differentiation is the only available learning path.

## Exact routes

Replace `<base>` with the deployed origin.

- [ ] `<base>/`
- [ ] `<base>/dashboard`
- [ ] `<base>/subjects`
- [ ] `<base>/subjects/higher-maths`
- [ ] `<base>/subjects/higher-maths/calculus`
- [ ] `<base>/subjects/higher-maths/calculus/differentiation`
- [ ] `<base>/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- [ ] `<base>/question/hm-calc-diff-basic-f-001`
- [ ] `<base>/question/hm-calc-diff-basic-a-001`
- [ ] `<base>/question/hm-calc-diff-basic-ppq-001`
- [ ] `<base>/subjects/higher-maths/question-bank`
- [ ] `<base>/subjects/higher-maths/revision-notes`
- [ ] `<base>/subjects/higher-maths/formula-cards`
- [ ] `<base>/subjects/higher-maths/worked-examples`
- [ ] `<base>/subjects/higher-maths/flashcards`
- [ ] `<base>/subjects/higher-physics`
- [ ] `<base>/not-a-real-route`

## Fresh-browser setup

1. Open a private/incognito window or clear site data for the beta origin.
2. Open the homepage. Do not sign in; no account is required.
3. Confirm the dashboard starts at `0 / 8 completed`.
4. Confirm copy says progress is local/saved on this browser.

Result: ______  Notes: ________________________________________________

## First 30 seconds and navigation

- [ ] The homepage identifies STEM Forge as structured Scottish SQA STEM learning.
- [ ] It says Higher Maths Basic differentiation is available in the private beta.
- [ ] Other subjects/paths do not appear available.
- [ ] The original SQA-style/non-affiliation statement is visible.
- [ ] Start Learning opens Basic differentiation.
- [ ] Dashboard -> Subjects -> Higher Maths -> Basic differentiation works without help.
- [ ] Foundations, Applications, and Past Paper-style Questions appear in that order with 3/3/2 questions.

Result: ______  Notes: ________________________________________________

## Complete question journey

Use Foundations question `hm-calc-diff-basic-f-001` first.

- [ ] Submit empty/whitespace input: no genuine attempt or completion is created.
- [ ] Submit an incorrect answer: feedback is calm and the question stays incomplete.
- [ ] Open the hint: it is useful/supportive and not presented as failure.
- [ ] Submit the correct answer: completion and progression are clear.
- [ ] On another question, submit a genuine incorrect answer and deliberately open the worked solution.
- [ ] The solution is gated until a genuine attempt and completion recommends review.
- [ ] Next/Previous navigation keeps stored question state.
- [ ] Progress moves from Foundations to Applications to Past Paper-style Questions in order.

Result: ______  Notes: ________________________________________________

## Completion, mastery, and support outcomes

Complete the path using a representative mix of independent answers, hint-assisted answers, and at least one solution-assisted completion.

- [ ] `Completed` means all required questions are complete, not necessarily mastered.
- [ ] `Secure` appears only when the existing 75% mastery threshold is met.
- [ ] `Mastered` appears only when all existing mastery/independence/Past Paper-style requirements are met.
- [ ] `Review Recommended` appears for supported or weaker evidence where expected.
- [ ] A later weaker attempt does not erase stronger earlier evidence.
- [ ] Question, dashboard, Higher Maths hub, and path claims agree.

Result: ______  Notes: ________________________________________________

## Persistence, revisit, and reset

- [ ] Refresh retains progress in the same browser.
- [ ] Navigate away and revisit: the completion celebration does not replay unexpectedly.
- [ ] Close/reopen the same normal browser: progress remains if site data was retained.
- [ ] Confirm progress does not imply account or cross-device storage.
- [ ] Reset Basic differentiation and accept the confirmation.
- [ ] Current attempts/readiness return to Not Started/zero.
- [ ] Internal QA only: V4 structural achievement snapshots remain in LocalStorage after reset.
- [ ] Other path records, if seeded internally, are not removed.

Result: ______  Notes: ________________________________________________

## Desktop QA

Test Chromium at approximately 1440 x 900.

- [ ] Persistent sidebar and top bar remain readable.
- [ ] No horizontal overflow, clipped cards, or clipped controls.
- [ ] Headings and breadcrumbs communicate hierarchy.
- [ ] Progress, status, completion, and recovery actions remain visible.
- [ ] Error and locked states provide a clear next action.

Result: ______  Notes: ________________________________________________

## Mobile QA

Test at 390 x 844; also test iOS Safari when available.

- [ ] Homepage, dashboard, hub, path, question, question bank, and resources have no horizontal scrolling.
- [ ] Mobile navigation is usable and does not hide core routes.
- [ ] Answer input and optional keypad work with the on-screen keyboard.
- [ ] Hint, submit, solution, and next-question controls are not clipped or cramped.
- [ ] Completion panel actions stack and remain readable.

Result: ______  Notes: ________________________________________________

## Keyboard, reduced motion, and accessibility

- [ ] Navigate core actions using Tab/Shift+Tab/Enter without a pointer.
- [ ] Focus is visible and follows a logical order.
- [ ] The answer field has a visible/accessibly associated label.
- [ ] Disabled/locked actions are distinguishable in text, not colour alone.
- [ ] Status changes and the completion panel remain understandable with reduced motion enabled.
- [ ] Heading levels and breadcrumb labels make sense.
- [ ] Text and controls remain readable at browser zoom.

Result: ______  Notes: ________________________________________________

## Locked and recovery states

- [ ] Higher Physics says Coming Soon/locked and exposes no fake active progress or question CTA.
- [ ] Its recovery action returns to Basic differentiation.
- [ ] An invalid route shows the not-found page with working Basic differentiation and Subjects links.
- [ ] A temporary error page, if exercised internally, offers Try again and a valid recovery route.

Result: ______  Notes: ________________________________________________

## Internal storage regression checks

These are for the owner/developer, not ordinary student testers. Prefer the existing Playwright fixtures instead of manual LocalStorage editing.

- [ ] Unversioned, V1, V2, and V3 fixtures remain readable and save forward as V4 only after valid activity.
- [ ] Unknown legacy evidence stays unknown.
- [ ] Malformed JSON/records fail safely without discarding unrelated valid records.
- [ ] Unsupported future payloads remain untouched.
- [ ] Snapshot corruption is repaired conservatively on the next valid write.
- [ ] Completion acknowledgement remains in the separate `stemforge.pathCelebration.v1` store.

Result: ______  Notes: ________________________________________________

## Known limitations to tell testers

- Basic differentiation is the only active learning path.
- Higher Physics and other subjects/paths are coming soon.
- Progress is local to one browser/device; there are no accounts or cloud sync.
- Reset is local and preserves internal historical achievement snapshots.
- No AI marking, mathematical equivalence engine, analytics, payments, or live feedback form exists.
- Answer marking intentionally uses normalized exact-string comparison.
- The facilitator collects feedback using the supplied Markdown questions.

## Feedback handoff

- [ ] Ask every question in `private-beta-feedback-template.md`.
- [ ] Record concrete route/question IDs for breakages.
- [ ] Separate blockers from preferences.
- [ ] Do not collect sensitive student data.
- [ ] Tag evidence as comprehension, navigation, answer input, support, status language, persistence, mobile/accessibility, content demand, or account/sync demand.

Final result: ______  Owner/facilitator: _______________________________
