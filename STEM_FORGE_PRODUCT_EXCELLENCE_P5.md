# STEM Forge Product Excellence — Sprint P5 (Student-Facing Clarity)

Sprint P5 began from clean commit `09f6d48` (`Complete Sprint P4 question interaction excellence`), plus one pre-existing uncommitted `CLAUDE.md` documentation update carried over from the prior session (untouched by this sprint). Scope: replace engineering/internal vocabulary on live student-facing surfaces with plain learning language, without changing marking, progress, mastery, sync, import, or next-action semantics.

## 1. Initial copy audit

Two parallel research passes covered the whole live app (excluding `/tuition` and `components/tuition`, an explicitly separate marketing sub-site):

- A literal, surface-by-surface copy inventory (landing, nav, beta notice, subjects, hub, roadmap, question workspace, completion panel, dashboard, practice, question bank, resource browser, account/auth, locked-content patterns, error/empty states, feedback dialog).
- A term-by-term grep sweep for `evidence, canonical, eligibility, association, private beta, proof of concept, planned, mastery, secure, mastered, review prompt, sync, import, local-first, owner, structural, diagnosis, completion evidence, active session, content version, pinned version, unsupported, unavailable, coming soon` classified as student-facing-change / student-facing-keep / dev-facing / accessibility-text / test-only / documentation-only / diagnostic-only.

Highest-priority findings: **"evidence"** used as the ordinary noun for stored progress (dashboard headings, empty states, sync copy); a dense concentration of engineering vocabulary on the sync/import/account surfaces (`Synchronization`, `association`, `provenance`, `generation`, `Browser coordination`); a live beta+roadmap counter (`"{subject} is in private beta: N available now, N planned."`); "canonical questions" and "genuine attempt" appearing verbatim in student sentences; and three independent hand-written copies of the same status-label formatting logic (a drift risk, not just jargon). A dynamic string the initial grep missed (`emptyReason()` in `lib/practice/practice-selection.ts`, only reachable when a practice mode has no eligible questions) was caught during manual browser verification and fixed in the same pass.

## 2. Student-facing glossary

| Concept | Decision |
|---|---|
| Completed / Secure / Mastered | Kept as the three tier labels — single source now in `formatProgressStatusLabel()` (`components/learning/mastery-badge.tsx`). Distinct, deliberately designed; explained via `path-completion-panel.tsx`'s supporting sentence rather than repeated inline. |
| Review / needs work | "Needs work" (dashboard section heading) kept; "review prompt(s) recommended" → "question(s) to review"; `ReviewBadge`'s "Review recommended" kept as the one chip label. |
| Independent / supported completion | "on your own" / "with support" language; dropped "readiness evidence" as a noun entirely. |
| Hint / worked-solution use | Framed as normal support, never as a mastery penalty: *"Using a hint is a normal part of learning — answering on your own next time is even stronger practice for the exam."* |
| Progress / course progress / stage progress | "Progress" replaces "evidence" as the ordinary noun everywhere it means the learner's own record. "Stage progress" (existing heading) kept as-is — already plain. |
| Practice / retry / reassessment | "Practice" kept. "Retry incorrect" kept as a distinct mode name from "Needs-work practice" (per Deliverable 8) — the two already read as separate actions and weren't merged. "Reassessment" doesn't appear in any live copy (dev/doc term only) — no change needed. |
| Account / save across devices | Explained by outcome: *"keep progress across devices"*, not by mechanism. |
| Import | Reframed by outcome throughout: *"Add this browser's progress to your account"* / *"Add progress to your account"* (was *"Confirm browser progress import"* / *"Import not completed"*). |
| Sync | Kept as the short word for buttons/status pill (`Sync now`, `Pause sync`, `Turn on sync`) — matches consumer-app convention and was already used inconsistently (`Enable synchronization` was the one holdout, now `Turn on sync`). Surrounding sentences no longer say "Synchronization," "association," or "provenance." |
| This browser / locked / unavailable / coming later | Kept as-is — already plain and consistent. "Coming soon" / "Coming Soon" casing was already inconsistent pre-P5; not touched (cosmetic-only, out of the term-substitution scope; noted below as a residual inconsistency). |
| Beta disclosure | Consolidated to the one dismissible `BetaNotice` banner (already persists dismissal per browser via `localStorage`). All other beta/proof-of-concept mentions removed or reworded (see §4). |

## 3. Terms removed from learner surfaces

- **"evidence"** (as ordinary noun) → "progress" / "changes": dashboard headings ("Course evidence" → "Course progress", "Weekly evidence" → "Weekly activity"), empty states, quick-link blurbs, sync status detail strings, hint/correct-with-hint feedback text, practice session-state note.
- **"canonical questions" / "registered"** → "available questions" (practice setup intro, practice session shortage text).
- **"genuine attempt"** → "answered question" (dashboard empty state).
- **"No diagnosis from zero evidence"** → *"Nothing appears until you've answered some questions."*
- **"eligible question(s) found"** → *"question(s) available"*.
- **"current-version incorrect attempts"** (a dynamically-generated shortage string, found during manual verification) → *"recent incorrect answers"*.
- **"Active proof of concept" / "proof-of-concept" / "proof of concept"** → removed from the sidebar panel, `not-found.tsx`, and the locked Higher Physics description.
- **"private beta" (repeated)** → removed from the landing hero and the dashboard course notice; kept only in the one `BetaNotice` banner.
- **"Synchronization" / "association" / "provenance" / "Browser coordination" / "generation"** → "Sync across devices," outcome-worded sentences, "Multiple tabs" (with "Fully/Partially/Not supported" values), "Account data version."
- **"STEM Forge owner"** → "your STEM Forge account" (`app/account/page.tsx`, 2 lines).
- **"will be added later"** placeholders (written/multi-step answer inputs, read as engineering TODOs) → *"...then compare it with the worked solution."*
- **"clean breadcrumb"** (feedback-report success toast) → *"enough to look into it."*
- Raw internal field names in the report dialog's diagnostics preview (`pageArea` values like `question_workspace` printed verbatim) → humanized via a small `formatPageArea()` display helper; the actual submitted payload is unchanged.

## 4. Terms deliberately retained, and why

- **"Secure" / "Mastered"** as mastery-tier labels — genuinely distinct product concepts per `STEM_FORGE_MASTERY_ARCHITECTURE.md` (Secure = complete + 75%, Mastered = complete + 90% + 70% correct without solutions); collapsing them would hide a real, useful distinction the sprint brief explicitly says not to hide.
- **"Sync"** as a short label — plain, common consumer-app vocabulary; only the surrounding technical narration was removed, not the word itself.
- **"Report this question" / "Send feedback"** — left as-is. `docs/frontend-work-plan.md` calls this "Give feedback on this question," but the live label has always read "Report" — a stale-doc/reality mismatch, not a live duplication, so out of scope for a copy-only sprint.
- **"triage"** in `AuthenticatedBetaReportStatus` ("Internal priority and triage details stay private") — understandable, reassuring, commonly used in consumer support UX; rewording risked losing precision for no real clarity gain.
- **Internal beta-ops surfaces** (`app/internal/beta-reports/*`) — diagnostic/admin-only, never shown to ordinary learners; explicitly out of scope.
- **Legal/consent-critical sentences** on `account-data-controls.tsx` / `account-learning-data.tsx` / `safe-sign-out.tsx` (irreversible deletion, backup-retention caveats) — softened in wording only; every distinction (what's deleted vs. preserved, "provisional" retention target, 10-minute cancellation window) was kept intact per the sprint's explicit "do not weaken warnings or consent language" rule.

## 5. Progress-language decisions

- Dashboard "Course evidence" → "Course progress"; "Weekly evidence" → "Weekly activity"; both now read as plain progress-tracking language rather than an internal data-model term.
- Zero-evidence / new-learner states were already careful before this sprint (`"No weak spots yet. Start a path..."`, `"No recent activity yet..."`) — reworded only the "evidence"/"genuine attempt" words inside them, not their meaning; no learner is described as behind or weak.
- "Nothing secure yet. Complete questions on your own to reach Secure status." replaces "...to unlock stronger evidence" — same meaning, plainer, and reuses the "Secure" tier name directly instead of an abstract "evidence" noun.
- "review prompt(s) recommended" → "question(s) to review" — a genuine learner action, worded as such.

## 6. Completed / Secure / Mastered

No new explainer copy was added — `path-completion-panel.tsx`'s existing `getPathCompletionSupportingSentence()` already explains the distinction in context ("You completed the path and showed strong understanding" for Secure, "...with strong independent performance" for Mastered) each time a tier is shown, which satisfies "explain the distinction once, then use concise labels consistently" without a new standalone document. This sprint did not judge a separate "How progress works" page necessary given that existing per-tier sentence.

## 7. Hint and support-language decisions

Removed "provide stronger readiness evidence" (both the correct-with-hint feedback message and the hint-panel note) in favor of encouragement that names the outcome directly: *"answering on your own next time is even stronger practice for the exam"* / *"shows you're ready to move on."* Hint/solution evidence semantics (what counts as genuine, what mastery weight it carries) are unchanged — only the sentence describing it changed.

## 8. Beta and future-content decisions

One discreet, dismiss-and-remember disclosure remains: `components/beta-notice.tsx`, rendered on every app page via `AppShell` but hidden after the first dismissal (`stemforge.betaNotice.dismissed.v1` in `localStorage`). Its copy dropped "diagnostics"/"trace" language for plain reassurance.

Removed or reworded elsewhere:
- Landing hero: no longer opens with "The private beta starts with..." — now states what the platform does now.
- Sidebar panel: "Active proof of concept" eyebrow → "Available now."
- Dashboard course notice (`deriveCourseDashboardSummary`): `"{subject} is in private beta: N available now, N planned."` → `"N {subject} path(s) ready to start, with more on the way."` — confident framing, future content acknowledged once and quietly, no raw counter.
- `not-found.tsx` and the locked Higher Physics description: "proof-of-concept" removed.

Kept unchanged: the footer's SQA/Qualifications Scotland non-affiliation disclaimer (legal, not status) and its tester-instructions line (operational, low-weight, not repeated elsewhere).

## 9. Account-language decisions

Reframed by outcome throughout `components/account/*` and `app/account/page.tsx`: "Adding this browser's progress to your account" / "keeping progress updated across devices" replace "Import" / "Synchronization" as the primary framing, while the underlying distinct actions (browser progress present vs. account progress vs. adding one to the other vs. ongoing sync) remain fully distinguishable — no functional collapsing. Irreversible-deletion and consent copy (`account-learning-data.tsx`, `safe-sign-out.tsx`, `account-data-controls.tsx`) had its vocabulary softened (`"Synchronization"` → `"Sync"`, `"generation"` → `"version"`, `"safely attributable record(s)"` → `"item(s) belonging to this account"`) without weakening any warning, confirmation step, or retention caveat.

`STEM Forge owner` (`app/account/page.tsx`) → "your STEM Forge account" / "we can't load your account details right now."

## 10. Practice-language decisions

- Mode descriptions rewritten in plain terms: "Uses existing review and completion evidence. No diagnosis from zero evidence." → "Uses your review recommendations and unfinished questions. Nothing appears until you've answered some questions."; "Uses your latest current-version genuine attempts." → "Practises only the questions you most recently got wrong."
- "Retry incorrect" remains visually and functionally distinct from "Needs-work practice" — two separate mode cards with separate descriptions; no logic change.
- Fixed a dynamically-generated shortage string (`emptyReason()` in `lib/practice/practice-selection.ts`) that a static grep couldn't catch: "There are no current-version incorrect attempts to retry right now." → "There are no recent incorrect answers to retry right now."; the generic fallback "No eligible questions are available..." → "No questions are available...".
- Selection logic, timing, and eligibility rules are untouched — only the sentences describing them changed.

## 11. Landing-page changes

- Hero no longer leads with "private beta" — states the platform's current value directly.
- SQA → Qualifications Scotland renamed consistently across the whole app (see §13), fixing a pre-existing naming inconsistency where `about-band.tsx` already said "Qualifications Scotland" while every other surface said "SQA."
- Premium/Coming Soon pricing tile, tuition link, and course-availability cards were left untouched — no marketing redesign, no fabricated claims added or removed beyond the beta/proof-of-concept phrase deletions already covered above.

## 12. A dashboard/status consistency fix found along the way

Three components independently hand-wrote the same "split on `_`, capitalize each word" status-label logic (`mastery-badge.tsx`, `local-skill-path-progress.tsx`, `higher-maths-question-bank.tsx`) — a drift risk the mastery-badge.tsx comment already flagged but didn't structurally prevent. Consolidated into one exported `formatProgressStatusLabel()` in `mastery-badge.tsx`; the other two now import and call it. No visible output changed (same algorithm, same source strings), but future edits can no longer fork.

Separately, the sync-status pill (`progress-sync-status.tsx`, topbar) and the account-page sync panel badge (`progress-sync-panel.tsx`) previously used two independent label functions — the panel's naively title-cased the raw status enum, which would have literally rendered "Association required" for `association_required` (never actually seen in this session's manual testing, since that state requires a signed-in account, but reachable in principle). Extracted one shared `syncStatusLabel()` (now exported from `progress-sync-status.tsx`) so both surfaces show the same word for the same state — a real, if narrow, cross-surface-consistency fix in the same spirit as Core Deliverable 10, found while implementing rather than pre-planned in the audit.

`achievementTitle()` in `lib/dashboard-derivations.ts` (produced "Path Secure" / "Stage Mastered" via full Title Case) was changed to sentence case ("Path secure" / "Stage mastered") to match the app's stated "sentence case everywhere" convention and the adjacent current-item title format (`${path.name} ${path.status}`, e.g. "Basic differentiation secure").

## 13. SQA → Qualifications Scotland naming (explicit product decision)

The audit found `about-band.tsx` already said "Qualifications Scotland" while every other surface (footer legal disclaimer, question workspace, question bank, resource browser, landing hero/how-it-works, hub, subjects page, path hero, `data/higher-maths.ts`, `data/subjects.ts`, `app/layout.tsx` metadata) said "SQA." Asked the product owner which name is currently correct given the real-world SQA→Qualifications Scotland transition; **directed to standardize on "Qualifications Scotland."** Applied across all live UI strings and page metadata, including the footer's legal non-affiliation line. Did not rename developer-facing identifiers (`STEM_FORGE_SQA_TAXONOMY_AND_MULTI_PATH_RUNTIME.md`, internal type/variable names, `CONTENT CREATED/` authoring source files) — those are dev/doc-facing, not learner-visible, and out of scope per the sprint's explicit rule against renaming domain identifiers for copy reasons alone.

## 14. Secure/difficulty word collision (explicit product decision)

The legacy Higher Physics demo dataset (`data/questions.ts`, 15 questions, not part of the active beta content) used `difficulty: "Core" | "Secure" | "Challenge"`, rendered as a literal "Secure" badge in `question-page.tsx` — colliding with "Secure" as a mastery-tier status used everywhere else in the app. Asked the product owner whether to fix this within P5; **directed to fix it, reserving "Secure" for mastery status only.** Inspected the full scale (Core = Foundations stage, Secure = Applications stage, Challenge = Past Paper stage — one difficulty value per stage, 5 questions each) and renamed the middle tier to **"Standard"** (`Core → Standard → Challenge`), a pure display-string change with no logic touched. No test or fixture referenced the literal string "Secure" as a difficulty value (confirmed by grep before and after); the `e2e/completion-experience.spec.ts` hits for "Secure" are all about the mastery tier and were unaffected.

## 15. Accessibility considerations

- `aria-label="Evidence-driven learner dashboard"` → `aria-label="Your learning dashboard"` (was internal vocabulary in an accessible name, not just visible text).
- No accessible name was made vague by these changes — button/link labels remain specific ("Turn on sync," "Add progress to your account," "Report this question," "Send feedback" all stayed distinct).
- The consolidated `formatProgressStatusLabel()` / `syncStatusLabel()` helpers changed no DOM structure, only string content, so existing `aria-live`, `role="status"`, and focus-management behavior from P4 is untouched.
- Colour-only status communication was not introduced or removed — pre-existing badge/pill patterns (tier badges plus text label, sync pill plus text label) were preserved as-is.

## 16. Test evidence

- `pnpm run typecheck` — pass.
- `pnpm run lint` — pass (after fixing 15 `react/no-unescaped-entities` errors introduced by new copy containing apostrophes, escaped to `&apos;`).
- `pnpm run validate-content` — pass, 0 errors, 1 expected warning (15 legacy Higher Physics questions, unchanged from baseline).
- `pnpm test` — pass, all 25 groups, 0 failures. One regression caught and fixed: `tests/dashboard-derivations.test.ts` asserted the old `/3 local evidence items/` string; updated to match the new "3 local changes waiting for account sync." wording (same underlying data, new words only).
- `pnpm run build` — pass, 35 routes generated.
- `pnpm run test:e2e:ordinary` — pass, 79/79, after two rounds of fixes:
  - A `getByText(/question.*available/i)` regex in `e2e/practice-sessions.spec.ts` matched two elements (strict-mode violation) because the loose pattern also matched unrelated copy ("questions selected from **available** content"); tightened to `/\d+ questions? available\./i`.
  - Two `getByText`/`toContainText` assertions in `e2e/practice-sessions.spec.ts` (lines 77 and 92, different variable names so a single edit missed the second) still expected the old "There are no current-version incorrect attempts" shortage string after that string was reworded in `lib/practice/practice-selection.ts`; both updated.
  - `e2e/dashboard.spec.ts`, `e2e/functional-honesty.spec.ts`, `e2e/mobile.spec.ts` updated for the "Course evidence" → "Course progress" heading rename.
  - `e2e/question-interaction-excellence.spec.ts`, `e2e/private-beta-readiness.spec.ts` updated for the SQA → Qualifications Scotland rename and the hero's dropped "private beta" phrase.
  - `e2e/progress-sync-real.spec.ts`, `e2e/account-data-safety-real.spec.ts` ("real"-auth suites, not run in the standard gate — require live Supabase credentials) updated for the "Enable synchronization" → "Turn on sync" button rename; not executed this session (no test credentials available), but kept in sync by inspection so they don't silently break for whoever next runs `test:e2e:sync:real` / `test:e2e:account-safety:real`.
- Environment note: hit the documented `.next` cache-corruption gotcha twice this session by running a manual preview dev server (port 3000) concurrently with a Playwright run that also touches `.next` (Playwright itself uses port 3070, so the conflict is the shared build cache, not the port). Recovered both times via `Remove-Item -Recurse -Force .next` before re-running; final e2e and build runs were done without a concurrent dev server and are clean.

## 17. Desktop, mobile, and manual validation

Manually walked (desktop 1280×720 and mobile 390×844, via a local dev server) through: landing page (hero, footer, how-it-works — confirmed no "private beta"/SQA leftovers); `/subjects` (sidebar "Available now" panel, no "proof of concept"); `/dashboard` (Course progress, Weekly activity, Needs work, Secure and mastered empty state, Quick links — all reworded copy renders correctly, real numbers, no layout regression); a live question workspace (Question details panel with the Qualifications Scotland sentence, hint text, submitted a correct answer and confirmed the "Correct" feedback and progress increment 1/8→2/8 still work); `/practice` (mode cards, the "no recent incorrect answers" shortage text, session preview) on both viewports — no horizontal overflow, primary action stays above the fold on mobile; `/account` signed-out state (account-shell footer copy). Did not exercise the signed-in sync/import/account-data-controls panels live (no test Supabase session available in this environment) — those were verified by source reading, the unit test suite (which does cover `dashboard-derivations` and `practice-selection` logic against the new strings), and by preserving every functional branch/condition unchanged in the diff.

## 18. Residual inconsistencies (not fixed this sprint)

- "Coming Soon" vs. "Coming soon" casing is inconsistent across `locked-card.tsx` defaults, `pricing.tsx`, and various inline badges — pre-existing, cosmetic, not a vocabulary-substitution issue; left as a follow-up.
- `docs/frontend-work-plan.md` still describes the question-workspace feedback link as "Give feedback on this question" when the live label has read "Report this question" since at least P4 — a stale-doc note, not a live-copy defect.
- `components/subject-detail-page.tsx` (an apparently-unreachable legacy component, not imported by any route) and `components/learning/content-sections.tsx`'s `MasterySummary()` (also unreachable) still contain pre-P5 wording patterns — left untouched since they render nowhere; flagged here rather than deleted, since dead-code removal is outside a copy-only sprint's scope.
- `components/locked-card.tsx` appears to have no current call sites in the surfaces this sprint covered (worth confirming before assuming it's needed).

## 19. Explicitly deferred work (per sprint scope)

Emotional celebration redesign, new achievements/badges/streaks, global navigation redesign, dashboard/question-workspace structural redesign, answer-engine changes, new worked-solution structures, new content, premium/payments, analytics, notifications, account/import/sync *logic* changes, teacher tools, tuition redesign, broad visual redesign — none implemented, per the sprint's explicit out-of-scope list. No storage keys renamed, no database schema touched, no remote writes added.

## 20. Commands run

```
pnpm run typecheck
pnpm run lint
pnpm run validate-content
pnpm test
pnpm run build
pnpm run test:e2e:ordinary
git diff --check
git checkout -- tsconfig.tsbuildinfo   # revert generated-artifact noise
```
