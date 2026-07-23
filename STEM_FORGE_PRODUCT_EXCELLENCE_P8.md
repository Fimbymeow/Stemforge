# STEM Forge Product Excellence P8

Phase II — Product Excellence, Sprint P8. Scope: make guided learning, Practice, the Question Bank and existing revision resources feel like one coherent study system. No content, marking, mastery, account, sync, backend or premium semantics were added or changed.

## 1. Initial coherence audit

The clean baseline was commit `cdc3e2f` (`Complete Sprint P7 mobile and accessible learning`). P3 already provided a sound canonical next-action contract, the Practice engine already provided deterministic version-pinned sessions, and P4–P7 had established the correct question, language, acknowledgement and accessibility foundations. The problem was presentation and connection:

- Practice required a new learner to inspect modes, question count, timing and a preview despite there being one course, one path and one useful default.
- Question Bank showed one available path among twelve locked paths but did not expose its eight questions directly.
- resource browsers placed the taxonomy and locked catalogue before the useful resource content on mobile;
- canonical Maths questions had no contextual resource links;
- resources could not begin relevant practice or return to an active session;
- the differentiation hub's resource routes, Question Bank, path and Practice page felt like separate destinations.

## 2. Duplicated flows

General practice was reachable through the dashboard, Question Bank and completed-path states, but each route stopped at generic setup. Needs Work, global recent-incorrect practice and exact-session retry appeared related despite having different rules. Resources were reachable through the topic roadmap, while the question workspace had no equivalent route. P3's guided continuation was already consistent and remains authoritative.

## 3. Quick Practice decision

Quick Practice is a one-click, six-question, untimed, targeted session. It:

1. resumes a valid active session instead of creating a competing session;
2. uses an explicitly supplied current path where available;
3. otherwise uses the path supplied by the canonical P3 next action;
4. otherwise uses the first canonical available path;
5. delegates question eligibility, deterministic ordering and pinned versions to the existing Practice engine.

The existing selection priority remains unchanged: current-version unattempted questions rank first, then latest incorrect work, review-recommended work and other previously attempted questions, with deterministic seeded/display-order tie-breaking. Locked, archived, unsupported, unresolvable and version-incompatible questions remain excluded. Session creation creates no attempt or progress evidence.

Quick Practice is available on Practice, the dashboard, resource pages and completed-path/practice states. It was not placed indiscriminately over guided-learning surfaces where P3 correctly recommends the next guided question.

## 4. Practice setup simplification

Practice now leads with one Quick Practice action. Deliberate configuration is under `Choose practice options`; question count and timing are under a second `Advanced options` disclosure. Closed disclosures remove their controls from keyboard focus.

Course and path selectors remain hidden over a set of one and reappear through the existing generic visibility contract. Mixed Practice appears only with multiple available paths. Needs Review appears only when genuine attempts make its deterministic selection non-empty.

## 5. Practice mode definitions

- **Quick Practice**: default six-question untimed path practice.
- **Path practice**: deliberately configured practice for one path.
- **Needs Review**: unfinished and review-recommended questions based on existing evidence rules.
- **Mixed Practice**: balanced practice across multiple genuinely available paths.
- **Exact-session retry**: only the incorrect references from one completed session, in original order with original pinned versions.

The stored `retry_incorrect` compatibility type remains intact, but global recent-incorrect practice no longer competes visibly with exact-session retry in today's one-path interface. Active session headings use student-facing mode names.

## 6. Session summaries

Existing summary counts and P3 routing remain. Incorrect sessions still make exact-session retry dominant. Fully correct sessions still acknowledge the result calmly. When P3 resolves to general practice, the summary now starts Quick Practice directly instead of sending the learner back through setup.

## 7. Question Bank

The bank now leads with the eight real available questions. Each row exposes:

- canonical stage, progress status, title and skill;
- a dominant direct question action;
- a secondary path-owned formula-card link.

Search, progress filtering, stage filtering and sorting remain available under `Filter and sort`. Filters operate on question progress rather than treating an entire path as one question state. The twelve future paths are retained under one collapsed disclosure. Generic multi-path query logic remains tested independently.

## 8. Available-resource ordering

Resource pages now place their available count, resource-type navigation, contextual practice action and real content before future inventory. Locked paths are collapsed at the end. `/resources` continues to redirect to the canonical Higher Maths formula-card destination.

## 9. Resource-context mapping

Relationships use canonical ownership:

- a question resolves to its canonical subject, course, path and stage;
- active resources are canonical children of the same path;
- related questions are the canonical active questions owned by that path.

No relationship is inferred from text, titles or learner answers. The present catalogue supports trustworthy path-level relationships only; question-level claims are deliberately deferred until explicit metadata exists.

## 10. Resource-to-practice behaviour

Every resource page offers one dominant contextual practice action for Basic differentiation and a secondary route to the related available questions. The action delegates to Quick Practice and refuses to create a session when no eligible questions exist. Merely opening, filtering or reading a resource creates no evidence.

## 11. Question-to-resource behaviour

The canonical question workspace now offers a compact support card:

- the path's formula card;
- one path-owned revision note;
- the path's worked example only after a genuine attempt exists.

These links remain secondary to answering. They do not reveal the question's worked solution or create attempts. In an active Practice session, resource URLs carry a validated same-origin return path and the resource page exposes `Return to active practice`.

## 12. Guided/practice boundary

Guided questions retain P3 stage/path navigation and completion. Practice questions retain the session panel and suppress guided Previous/Next controls. The session is still completed only through its summary, and exact retry creates a new session rather than mutating the original. Resource navigation does not change session identity or current question.

## 13. Empty states

Needs Review is absent before genuine progress. Exact retry is absent without session-specific incorrect questions. Question Bank filter emptiness offers a clear reset. Resource emptiness leads back to the available path rather than showing locked inventory as the answer. Missing or stale Practice content continues to fail safely through existing validation.

## 14. Mobile behaviour and the 320px investigation

At 320px, the in-app Windows browser initially reported an 11px document overflow: `clientWidth` was 305px after a classic 15px vertical scrollbar, while the four-item mobile navigation's right edge was about 316px. The Account link was the final reported overflowing element.

The repository's supported automated Chromium environment did not reproduce this:

- ordinary auth-off Chromium passed the existing three-item navigation geometry test;
- Practice, Question Bank, formula-card and question routes all passed `scrollWidth === clientWidth` at 320×568;
- auth-enabled Chromium passed a new four-item geometric test with Dashboard, Subjects, Path and Account all visible and `scrollWidth === clientWidth`.

This classifies the observation as a Windows in-app-browser classic-scrollbar rendering difference, not a reproducible P7 navigation or route-specific regression. In accordance with the evidence-gated requirement, no speculative shared CSS change was applied and all four destinations remain visible.

Practice now shows Quick Practice before configuration. Question Bank shows available questions before filters/future paths. Resource content appears before locked inventory. The representative 320px geometric assertions are permanent regression coverage.

## 15. Accessibility behaviour

Native disclosures expose expanded state and prevent closed configuration controls from entering the focus order. Practice types are grouped in a labelled fieldset and use pressed state. Question filters use visible labels and a labelled fieldset. Direct question and contextual resource links have distinct accessible names. Resource-type navigation identifies the current page. Active-session return links state their destination. A keyboard-only resource → Practice → summary flow is covered.

## 16. Test evidence

Focused unit coverage includes Quick Practice derivation, deterministic selection, single/multiple option visibility, question-level Question Bank filtering, safe path-owned resource relationships, contextual return links, missing resources, exact retry and pinned versions.

Focused browser coverage includes one-click Quick Practice, active-session resume, direct Question Bank entry, collapsed future inventory, question/resource return context, evidence-free resource navigation, resource-first mobile ordering, post-attempt worked-example visibility, keyboard completion and 320px route geometry.

Final comprehensive command counts are recorded in the completion report after the safe gate.

## 17. Manual validation

Manual validation covers new and returning learner Practice entry, direct question opening, formula/note/example navigation, active-session return, exact retry, fully correct summary, 320×568 and 390×844 layouts, keyboard operation, accessible names and console/hydration state. Physical iOS/Android devices and paired screen-reader software remain outside local verification.

## 18. Residual limitations

- Resource relationships are path-level because the current content model has no explicit question-to-resource metadata.
- The live catalogue cannot demonstrate Mixed Practice; the existing synthetic multi-path fixtures retain that coverage.
- The in-app Windows scrollbar difference is documented but not reproduced by supported automated Chromium, including auth-enabled four-item navigation.
- Physical-device and real assistive-technology testing still require external hardware.

## 19. Explicitly deferred

No new content, question selection builder, adaptive algorithm, spaced repetition, AI, analytics, backend work, account/sync change, dashboard redesign, navigation redesign, premium work or catalogue infrastructure was added.
