# Frontend work plan

Status as of the session that wrote this file. See `CLAUDE.md` for orientation and the parallel-work warning — read that first.

## What's done (verified live in browser, not just build-green)

1. **Color system**: orange (`#ff7514`) → ink-blue (`#234b6e`) across the whole app. Added `success`/`danger`/`warning` semantic tokens. Fixed real bugs uncovered along the way: `app/globals.css` had a second, unmigrated copy of the old palette (dead `--paper`/`--ink`/`--accent` vars, an orange `:focus-visible` ring, a radial-gradient class that didn't even compile); contrast on `danger-soft` text was under WCAG AA; the wrong-answer state reused the brand accent color instead of a real semantic color.
2. **Every original-scope page** decluttered and resized: dashboard, hub, differentiation topic page, question workspace, question bank, revision-notes/formula-cards/worked-examples/flashcards, Higher Physics locked page, resources. Root cause was fluid `clamp()` H1s scaling to 42–64px (landing-page-hero sizing on internal pages) — normalized to fixed 24–32px.
3. **Subjects page rebuilt** from 6 redundant panels repeating the same stats into a clean 4-box grid (2 real subjects + 2 generic "coming soon" placeholders, no fabricated content).
4. **New topic roadmap navigation** (the headline feature this session): `components/learning/icon-node-path.tsx` (shared connected-icon-row primitive), `topic-roadmap.tsx` (leaf level: 8 real Differentiation topics, selecting one shows a 5-tile Notes/Formula/Examples/Flashcards/Practise panel for the unlocked one, an honest "being prepared" state for locked ones — no padlock/gating implication, that was a deliberate fix per user feedback), `subject-roadmap-navigator.tsx` (drills Units → Spec Areas → Topics, auto-skipping any level with only one real option, reusing the same icon-node component at every level — not a different UI per level).
5. **Hub page restructured**: Guided Learning Path card extended to include Question Bank as a second CTA (was two separate cards); Learn/Practice/Exam-prep sections removed entirely, replaced by the roadmap.
6. **Redundancy cleanup**: `/subjects/higher-maths/calculus` and `/subjects/higher-maths/calculus/differentiation` both now `redirect()` to the hub, since the hub's auto-skipping roadmap shows identical content inline. Confirmed no other code depends on their old rendered content (only their `href`s are referenced elsewhere, which still resolve fine through the redirect).
7. **Consistency fixes**: `components/locked-card.tsx` and two stray `ButtonLink` usages (Higher Physics page, Resources page) were still using the legacy uppercase/bordered button style — replaced with the sentence-case solid style used everywhere else. Resources page also had the same redundant sidebar pattern already removed from the differentiation page — removed there too.
8. **Motion pass**: `ProgressBar` fill now animates (`transition-[width]`); answer-feedback/worked-solution cards fade-rise on reveal; roadmap level-switches and topic-switches fade-rise; roadmap icon nodes and dashboard quick-links get a hover lift; global `prefers-reduced-motion` override in `globals.css` neutralizes all of it for users who need that.
9. **Question workspace UX**: "Try again" button after a wrong answer (resets local state only, doesn't touch marking logic — verified `saveQuestionAttempt`/`getLatestAttempts` already treat re-submission as "latest wins," so no `local-progress.ts` change was needed); "Give feedback on this question" link added (was dashboard-only before); meta bar (Stage/Source/Skill/Marks/Progress) changed from `justify-between` sprawl to a tight cluster.
10. **Hydration bug found and fixed**: 6 components synchronously called `getSkillPathProgress`/`getStageProgress`/`getNextQuestionId` during render, which reads `localStorage` — safe on the server (returns zero-state) but returns real data immediately client-side, causing a server/client mismatch on any page load with existing progress. Fixed via `lib/use-mounted.ts` + an additive `attemptsOverride` param (backward-compatible, no existing call site's behavior changed). Verified fixed live with the exact repro (hard-navigate to hub/dashboard/question-bank with non-zero `localStorage` progress — no error, correct numbers immediately).

All of the above verified against `pnpm typecheck` / `pnpm lint` / `pnpm build` (which now also runs `validate-content`) and `pnpm run test` (43+ unit tests from the parallel progress/mastery/answer-engine work — all passing), plus live browser verification via Claude-in-Chrome once it connected (it was disconnected for most of the session; several rounds of "trust the build, can't see it" happened before that — see below).

## Known gaps / what to check next

**High priority — do this first:**
- **Reconcile with `lib/progress/`.** See the warning in `CLAUDE.md`. If that module is the real/future progress source, the `useHasMounted` hydration-safety pattern needs to be ported there, and it's worth checking whether `lib/local-progress.ts` is being phased out from under the UI this session built on.
- **Run `pnpm run test:e2e`** (Playwright). Never run this session — only the fast unit suite (`pnpm test`) was. The e2e specs (`navigation.spec.ts`, `question-flows.spec.ts`, `mobile.spec.ts` especially) may exercise routes that were redirected or restructured this session (`/subjects/higher-maths/calculus`, `/subjects/higher-maths/calculus/differentiation`) — check they don't assert on the old page content.
- **Mobile viewport of the roadmap was never actually verified.** The `resize_window` tool didn't visibly change the rendered viewport when tried — screenshots stayed desktop-sized. The `IconNodePath` horizontal-scroll row (`-mx-1 overflow-x-auto`) should work on touch but this is unconfirmed. Check on a real device or find a working resize path.

**Design polish identified but not yet done** (see the "less AI slop" discussion, all still valid):
- Roadmap nodes all use the same `BookOpen` icon regardless of topic — the single clearest "templated" tell in the app. Per-topic icons (chain-link for Chain rule, a target for Optimisation, etc.) would fix this.
- The "being prepared" copy in `TopicRoadmap`'s locked-node panel is identical boilerplate across all 7 locked topics — worth varying or shortening.
- No distinct "completed a skill path" moment anywhere — `LocalLearningStageCard`'s button just relabels to "Review stage." This is the one place a product-register app is allowed a real delight beat.
- Never checked favicon/tab title/meta tags.
- `IconNodePath`'s selected node has no `aria-current` — screen readers can't tell which topic is active.
- Landing page (`components/landing/*`, never touched) has the "tiny uppercase eyebrow above every section" pattern flagged as a top AI-slop tell by the design guidance used this session — out of original scope, but worth knowing it's there.

**Explicitly flagged, explicitly not fixed (still open, needs your call):**
- `normaliseAnswer` in `question-workspace.tsx` strips all `*` and `{`/`}` characters before comparing answers — a real correctness risk (could silently mis-mark), but it's answer-checking logic, out of this session's scope.
- No keyboard shortcuts anywhere (noted in the original `/impeccable critique`, low priority for this app).
- The pre-existing ad-hoc green "complete" color family (`#229954`/`#188246`, used in `mechanics-topic-page.tsx`, `question-page.tsx`, `higher-maths-question-bank.tsx`, and a couple `subject-learning-pages.tsx` branches) was never consolidated into the new `success` token — doesn't collide with anything, just inconsistent if you look closely.

## Environment notes for whoever continues this

- Claude-in-Chrome (browser tool) was disconnected for most of this session (`list_connected_browsers` returned `[]`). Fixed mid-session when the user connected a browser — if it's disconnected again next session, check `list_connected_browsers` / `select_browser` / `switch_browser` before assuming it's a lost cause; last time it needed the user to actually open Chrome with the extension running, not just have it installed.
- Dev server + build cache corruption: see `CLAUDE.md`. Don't run `pnpm build` while `pnpm dev` is active against the same `.next` folder.
