# STEM Forge Post-P10 Sprint A

Dashboard and navigation correction. Baseline: `bd980a0` (`Complete Sprint P10 final product polish`). Scope is limited to the confirmed report-control, Higher Maths access, dashboard information architecture, and reset-navigation contracts. No Question Bank redesign, placeholder catalogue, Reasoning metadata, learning semantics, progress calculations, authentication, import, synchronization, ownership, or local-first behavior changed.

## Reproduced defects

- `Report this question` had one accessible button but two visible `MessageSquare` SVGs inside its surrounding hit area: one supplied by `ReportDialog` and one route-specific wrapper icon.
- The fresh dashboard recommendation was the only visible Higher Maths action, so `Start learning` replaced ordinary course access.
- The Subjects-page Higher Maths card had the same defect: its action destination and label changed with the recommendation instead of always offering the course hub.
- The dashboard still rendered the large Course progress, Recent activity, Weekly activity, and Quick links architecture after those sections had ceased to help answer “What should I do now?”
- No forced reset redirect was reproduced. Reset already updated the path in place, so no redirect fix was invented.

## Final dashboard hierarchy

1. One Higher Maths card with a linked course title, an always-present primary `Open Higher Maths` action, and one contextual secondary recommendation from the unchanged `deriveLearnerNextAction()` contract.
2. Compact current-stage context, the unchanged completed/total denominator, and one progress bar only when progress exists.
3. A standalone compact Quick Practice card immediately after the course card.
4. The unchanged guest-progress protection component when its existing conditions are met.
5. Needs work only when at least one real routed action exists.
6. Secure and mastered only when earned, presented as a quiet conditional record.

## Removed dashboard sections

- Recent activity
- Weekly activity
- The `Quick links` heading and its Question Bank/resource shortcut group
- The standalone per-path Course progress section and its stage-by-stage detail
- Empty Needs work and Secure/mastered placeholders

The underlying derivations remain intact because other stable contracts and tests use them; only dashboard presentation changed.

## Retained conditional sections

Needs work remains useful because every rendered item is a genuine route to the next question or review action. Secure and mastered also remains useful as a quiet earned record, but it is hidden until evidence exists. Guest progress protection is unchanged in copy, conditions, and behavior.

## Primary and secondary course behavior

Both `/dashboard` and `/subjects` now expose:

- primary: `Open Higher Maths` → `/subjects/higher-maths`;
- secondary: the single contextual result from `deriveLearnerNextAction()`.

The Higher Maths title also links to the hub. The title, primary link, and secondary link are siblings rather than nested interactive controls. Coverage proves this contract for fresh, active-path, review, active-practice, and completed-content learners.

## Report control

The question route now renders the canonical `ReportDialog` trigger directly. It has one button, one accessible name, one hit area, and exactly one decorative SVG. `ReportDialog` marks that icon `aria-hidden="true"` for every use, including the global feedback control.

## Reset-navigation evidence

Regression coverage proves:

- `/dashboard` remains directly accessible with empty progress;
- an empty learner sees `Start Basic differentiation` and is not redirected;
- sidebar/mobile navigation remains present;
- resetting Basic differentiation keeps the exact path URL;
- the path changes to Not Started in place;
- refresh preserves the reset;
- the empty dashboard remains available afterward.

## Responsive and accessibility validation

Automated Chromium checks cover Dashboard and Subjects at 1440×900, 1024×768, 720×450 (the CSS-pixel equivalent of a 1440×900 view at 200% zoom), 390×844, 360×800, and 320×568. They prove:

- one main landmark and normal P7 navigation;
- distinct primary and secondary visual treatments;
- 44px minimum action heights;
- primary-before-secondary keyboard order;
- safe recommendation wrapping;
- no document overflow;
- active-practice and review recommendations remain secondary at 320px.

Manual in-app Chromium confirmed the same hierarchy and route geometry. At 320px it reproduced the already documented P8 Windows classic-scrollbar measurement: the physical viewport remained 320px wide, but `documentElement.clientWidth` became 305px after a 15px classic scrollbar while the unchanged Account navigation link ended at approximately 316px. All four destinations remained physically visible. Supported automated Chromium, including auth-enabled navigation, reports zero overflow. This is not a Sprint A or P7 regression, so no speculative navigation CSS was applied.

## Verification

Passing results:

- focused dashboard derivations: 7/7;
- focused next-action semantics: 12/12;
- focused Sprint A browser scenarios: 20/20 after marking the canonical report icon decorative;
- unit/integration aggregate: 322/322;
- ordinary Playwright: 107/107;
- authentication-enabled Playwright: 5/5;
- platform hardening: 1/1 in Firefox, 1/1 in Chromium, and 1/1 in WebKit;
- type checking, lint, content validation, and production build pass.

The monolithic `pnpm run test:all` wrapper did not itself return cleanly in this Windows environment because its first Firefox child froze at different navigation points on repeated runs. The identical unchanged hardening command passed immediately when run directly in all three engines. Every remaining gate stage then ran sequentially with fail-fast behavior and passed. No retries, sleeps, assertion weakening, product changes, or timeout increases were used to hide the wrapper-specific browser-process issue.

## Files changed

- `components/dashboard-local-progress.tsx`
- `components/subjects-page.tsx`
- `components/questions/question-workspace.tsx`
- `components/beta-reports/report-dialog.tsx`
- `e2e/dashboard-navigation-correction.spec.ts`
- `e2e/dashboard.spec.ts`
- `e2e/consistency-reset.spec.ts`
- `e2e/navigation.spec.ts`
- `e2e/next-action.spec.ts`
- `e2e/private-beta-operations.spec.ts`
- `e2e/stage-and-accomplishment-experience.spec.ts`
- `STEM_FORGE_POST_P10_SPRINT_A.md`

## Residual questions for Sprint B

- Validate the dashboard hierarchy with Internal Alpha learners before removing or promoting any remaining conditional evidence lane.
- Keep the Windows in-app classic-scrollbar observation documented unless it becomes reproducible in supported automated browsers or on a physical 320px device.
- Do not infer a need for additional dashboard widgets from whitespace; add nothing without learner evidence.
