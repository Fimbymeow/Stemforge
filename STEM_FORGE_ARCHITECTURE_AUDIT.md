# STEM Forge Architecture Audit

Audit date: 11 July 2026  
Audit scope: repository inspection, runtime verification and documentation only  
Repository: `C:\Users\Finlay\Documents\STEMFORGE`

> Historical checkpoint: this audit records the repository as inspected on 11 July 2026. For current V4 architecture, verification counts, feedback handling, and private-beta instructions, use `STEM_FORGE_HANDOFF.md` and `STEM_FORGE_PRIVATE_BETA_READINESS.md`.

## 1. Executive summary

STEM Forge is a frontend-only Next.js 15 application with one complete active learning slice: Higher Maths -> Calculus -> Differentiation -> Basic differentiation. The student-facing shell, content hierarchy, eight-question path, maths rendering and browser-local progress flow are coherent enough for a small private beta. The production build succeeds and all current major routes render.

The architecture is intentionally simple: static TypeScript objects own learning content, route components select those objects, client components own interaction state, and `localStorage` records attempts. There is no server data layer, authentication, database, API, analytics or external service integration.

The strongest boundaries already present are:

- `data/types.ts` for shared content types.
- `data/higher-maths.ts` and `content/questions/...` for static content.
- `lib/learning-paths.ts` for catalog traversal and active-path selection.
- `lib/local-progress.ts` for browser progress persistence and derivation.
- `components/questions/question-workspace.tsx` for the active question flow.
- `components/layout/*` for the reusable application shell.

The main architectural risks are:

1. The active Higher Maths question engine and retained Higher Physics demo engine use different types, labels and rendering flows.
2. Content relationships are manually coordinated across files without runtime schema validation, duplicate-ID checks or referential-integrity checks.
3. Algebraic marking is normalised exact-string comparison, not mathematical equivalence.
4. Any submitted attempt, including an incorrect one, counts as question completion; mastery is not formally calculated.
5. Progress storage has no payload version, migration layer or replaceable repository interface.
6. There is no automated test suite or continuous-integration workflow.

The safest next sprint is content schema hardening and automated content validation. That should happen before database or authentication work so future storage and import systems inherit one stable, verified content contract.

## 2. Current technology stack

| Area | Current implementation | Evidence |
|---|---|---|
| Framework | Next.js App Router 15.5.20 | `next` package and `app/` routes |
| UI runtime | React 19.2.7 / React DOM 19.2.7 resolved by lockfile | `package.json`, `pnpm-lock.yaml` |
| Language | TypeScript 5.7+, strict mode, no JavaScript source | `tsconfig.json`, `allowJs: false`, `strict: true` |
| Build tool | Next.js production build using the current Next 15 toolchain | `next build` |
| Package manager | pnpm 11.7.0 | `pnpm-lock.yaml`, `pnpm-workspace.yaml`, verified CLI |
| Styling | Tailwind CSS 3.4 plus global CSS | `tailwind.config.ts`, `app/globals.css` |
| Component system | Local React components and three small UI primitives | `components/`, `components/ui.tsx` |
| Icons | Lucide React | `lucide-react` imports |
| Maths rendering | React Markdown + remark-math + rehype-katex + KaTeX | `MathContent`, global KaTeX CSS import |
| Routing | Filesystem App Router, static and dynamic segments | `app/` |
| State management | React local state, derived static data and browser `localStorage` | hooks and `lib/local-progress.ts` |
| Data fetching | None | no `fetch`, query client or server data layer found |
| Forms | Controlled native inputs and buttons | question inputs, search/filter inputs |
| Backend/API | None | no `route.ts` or API directory found |
| Database | None | no database client or ORM dependency found |
| Authentication | None | no auth dependency, provider or middleware found |
| Testing | No configured test runner or test files | no test script or test configuration found |
| Linting | ESLint 9 with `next/core-web-vitals` | `eslint.config.mjs` |
| Formatting | No formatter configured | no Prettier configuration or script found |
| Deployment | Generic Next.js deployment; no provider configuration | no `.vercel`, Netlify or CI configuration |
| Environment variables | Optional `NEXT_PUBLIC_SITE_URL` only | `app/layout.tsx` |

The application colour system uses muted blue as `forge` (`#234b6e`) and `forge-soft` (`#e4ebf1`). This is intentional and was not changed by the audit.

## 3. Repository structure

```text
app/
  layout.tsx                     Root metadata, font, KaTeX and global CSS
  page.tsx                       Public landing page composition
  dashboard/                     Dashboard and duplicate demo route
  subjects/                      Catalog, Higher Maths, locked Physics and resources
  question/                      Empty/demo Physics page and dynamic question route
  resources/                     Locked/general resources page
  error.tsx                      Segment error boundary
  not-found.tsx                  Global 404

components/
  landing/                       Public homepage sections
  layout/                        AppShell, sidebar, topbar and page container
  learning/                      Roadmaps, stages, progress and resource components
  questions/                     Active workspace, answer inputs, keypad and maths renderer
  ui.tsx                         Card, ButtonLink and ProgressBar primitives
  subject-learning-pages.tsx     Shared subject/course/topic/skill templates
  question-page.tsx              Legacy Higher Physics demo question UI

content/questions/
  higher-maths/differentiation.ts  Eight active Basic differentiation questions

data/
  types.ts                       Shared content model
  higher-maths.ts                Active subject, path, stages and resources
  higher-physics.ts              Locked subject catalog
  questions.ts                   Legacy Higher Physics demo questions
  question-registry.ts           Active/legacy question lookup bridge
  subjects-registry.ts           Subject/course/spec lookup helpers
  subjects.ts                    Simplified catalog presentation data
  active-path.ts                 Active-path navigation helpers

lib/
  learning-paths.ts              Catalog traversal and route helpers
  local-progress.ts              Local attempt storage and progress derivation
  use-mounted.ts                 Hydration-safe mounted-state hook
  beta.ts                        Placeholder feedback URL

public/
  assets/                        Logos and landing mockups
  resources/                     Higher Physics PDFs retained but secondary

docs/
  private-beta-checklist.md      Manual beta QA checklist
```

There are also retained or likely legacy modules including `components/mechanics-topic-page.tsx`, `components/subject-detail-page.tsx`, `components/question-page.tsx`, `data/questions.ts`, `data/topics.ts`, `data/mock-progress.ts` and the `/demo` routes. They are not removed because this sprint is audit-only.

The untracked `CONTENT CREATED/` directory contains future markdown question-bank material. It is not imported by the running application and has no current validation or ingestion path.

## 4. Route map

### Primary routes

| Route | Main component | Important children | Data/progress | Classification | Notes |
|---|---|---|---|---|---|
| `/` | `app/page.tsx` | Landing sections | Mostly hard-coded copy; active-path helper for CTAs; no progress | Public, static | Homepage preview still contains older demo imagery. Responsive landing layout. |
| `/dashboard` | `DashboardPage` | `AppShell`, `DashboardLocalProgressSection` | Active skill path + `localStorage` | Student-facing, static shell + client data | Primary app entry. Renders zero progress before mount to avoid hydration mismatch. |
| `/subjects` | `SubjectsPage` | subject cards, `AppShell` | `data/subjects.ts`; no progress | Student-facing, data-driven catalog | Route explicitly uses `mode="demo"`; Higher Maths active, Physics locked. |
| `/subjects/higher-maths` | `HigherMathsHub` | guided path, roadmap navigator | active subject/path + `localStorage` | Student-facing, data-driven/client | Main Higher Maths hub and current visual baseline. |
| `/subjects/higher-maths/calculus` | redirect | none | none | Student-facing redirect | Redirects back to Higher Maths hub; it is not a standalone course page. |
| `/subjects/higher-maths/calculus/differentiation` | redirect | none | none | Student-facing redirect | Redirects back to Higher Maths hub; topic selection occurs inside client roadmap UI. |
| `/subjects/higher-maths/calculus/differentiation/basic-differentiation` | `SkillPathLearningPage` | generic template, local stage/progress components | subject registry + `localStorage` | Student-facing, data-driven | Active learning-path page. Mobile stacks main and side columns. |
| `/question/[id]` | `QuestionWorkspace` or legacy `QuestionPage` | inputs, keypad, maths, progress | question registry + `localStorage` | Student-facing, dynamic | Maths IDs use active workspace. Known legacy Physics IDs use demo engine. Unknown IDs return 404. |
| `/subjects/higher-maths/question-bank` | `HigherMathsQuestionBank` | search, filters, selected path | static skill paths + `localStorage` | Student-facing, data-driven/client | Filters are client-local. Only active path has questions. |
| `/subjects/higher-maths/revision-notes` | `HigherMathsResourceBrowser` | notes cards, search | active skill-path notes | Student-facing, data-driven/client | Resources are embedded in `data/higher-maths.ts`. |
| `/subjects/higher-maths/formula-cards` | `HigherMathsResourceBrowser` | formula cards, `MathContent` | active skill-path formula data | Student-facing, data-driven/client | KaTeX rendering. |
| `/subjects/higher-maths/worked-examples` | `HigherMathsResourceBrowser` | worked examples | active skill-path example data | Student-facing, data-driven/client | Static step content. |
| `/subjects/higher-maths/flashcards` | `HigherMathsResourceBrowser` | reveal/hide cards | static flashcard data; page-local reveal state | Student-facing, data-driven/client | Reveal state is not persisted. |
| `/subjects/higher-physics` | `SubjectCoursePage` | `LockedSubjectPage` | `data/higher-physics.ts` | Student-facing, locked | Deliberately redirects attention to active Higher Maths path through CTA. |
| `/resources` | `ResourcesPage` | locked/general resource cards | static copy | Student-facing, static | Physics PDFs are not presented as active. |
| `/_not-found` / unknown route | `not-found.tsx` | recovery CTAs | active-path helper | Public fallback | Returns 404 and links to active path/subjects. |

### Retained and duplicate routes

| Route | Behaviour | Audit observation |
|---|---|---|
| `/dashboard/demo` | Same `DashboardPage mode="demo"` as `/dashboard` | Duplicate compatibility/demo route. |
| `/subjects/demo` | Same `SubjectsPage mode="demo"` as `/subjects` | Duplicate compatibility/demo route. |
| `/question` | Empty legacy `QuestionPage` | Not part of active Higher Maths journey. |
| `/question/demo` | Demo legacy Physics question page | Retained legacy presentation. |
| `/subjects/higher-physics/our-dynamic-universe` | Generic course-area route, then locked subject page | Renders locked state because subject is unavailable. |
| `/subjects/higher-physics/our-dynamic-universe/[specArea]` | Validates spec slug, then generic locked page | Invalid spec slugs return 404; valid slugs remain locked. |

Routes present in Higher Physics data for `particles-and-waves` and `electricity` do not have matching route files. They are currently unreachable through active UI because the subject is locked, but they are not valid runtime destinations if directly entered.

### Navigation entry points

- Public navbar: homepage anchors, dashboard and active Basic differentiation CTA.
- App sidebar: dashboard, subjects and current active path.
- Higher Maths hub: active path, question bank and resource roadmap.
- Dashboard: continue next unanswered question, open path, question bank and notes.
- Basic differentiation page: stage-first-question links and recommended next unanswered question.
- Question workspace: breadcrumb links, previous/next navigation, feedback placeholder.

Desktop uses a fixed 268px sidebar. At the `xl` breakpoint and below, it becomes a sticky top area with horizontally scrollable navigation. Main two-column layouts stack at `lg` or `md` breakpoints. Maths content permits horizontal scrolling for long KaTeX expressions.

## 5. Content model

### Current hierarchy

```text
Subject
-> CourseArea
-> SpecArea (alias of Topic)
-> SkillPath
-> LearningStage
-> Question IDs
-> Question records
```

The shared types are defined in `data/types.ts`. Higher Maths instantiates the hierarchy in `data/higher-maths.ts`; questions live separately in `content/questions/higher-maths/differentiation.ts` and are connected through manually repeated string IDs.

### Structure status

| Structure | Definition | Record location | Relationship style | Scale/readiness |
|---|---|---|---|---|
| Subject | `Subject` | subject data files | owns course areas and subject stages | Reusable, but has overlapping fields (`subjectName`, `subject`, `level`). |
| Course | `CourseArea` | subject data files | nested in subject | Reusable. Route and availability are stored in content data. |
| Topic/spec area | `Topic`; `SpecArea = Topic` | subject data files | nested in course area | Alias hides domain distinction; acceptable for current slice, ambiguous at scale. |
| Skill path | `SkillPath` | subject data files | nested in spec area | Rich object currently mixes content, UI copy, navigation and mock progress. |
| Stage | `LearningStage` | skill path and duplicated at subject level | links questions through `questionIds` | Stable IDs, but definitions are duplicated for Higher Maths. |
| Question | `Question` | separate content file | manually links by `skillPathId`, `stageId` and stage question IDs | Suitable for small static set; needs validation before bulk import. |
| Notes/formulas/examples/flashcards | typed resource objects | embedded in skill path | direct nested arrays | Easy to render, but a large catalog would make subject files oversized. |

### ID behaviour

- IDs are manually authored strings.
- Active question IDs follow a readable convention such as `hm-calc-diff-basic-f-001`.
- Stage and skill-path IDs are also manual.
- Question-to-stage membership is represented twice: `Question.stageId` and `LearningStage.questionIds`.
- Question-to-path membership is represented twice: `Question.skillPathId` and nesting/stage references.
- No runtime code verifies that both directions agree.
- A source scan found no duplicate explicitly declared `id` fields in current TypeScript content.
- No automated duplicate check runs during lint or build.

### Validation, publishing and versioning

- TypeScript validates object shape at compile time.
- There is no runtime schema library or content validation command.
- There is no import parser for the markdown files in `CONTENT CREATED/`.
- Question status is `draft | ready`; there is no explicit published state.
- Resource objects support optional availability status, but no publication workflow consumes it.
- There is no schema version or per-question content version.
- There is no mechanism for old progress to respond to changed or removed question IDs.

### Import-readiness fields

| Desired field | Support | Notes |
|---|---|---|
| `id` | Clean | Required manual string. |
| `skillPathId` | Partial | Optional in type but present on active questions; no referential validation. |
| `stageId` | Partial | Optional in type but present on active questions; no referential validation. |
| `type` | Partial | Named `answerType`, so an importer must map the field. |
| `marks` | Clean | Required number. |
| `questionText` | Clean | Markdown/LaTeX string. |
| `correctAnswer` | Clean | Required string, but not sufficient for mathematical equivalence. |
| `acceptedAnswers` | Clean | Required string array. |
| `hint` | Clean | Required string. |
| `workedSolution` | Clean | Required Markdown/LaTeX string. |
| `commonMistake` | Clean | Required string. |
| `source` | Clean | Required free-text string. |

The model can hold hundreds of records in source control, but cannot safely ingest or govern thousands until validation, indexing, publication and versioning are defined.

## 6. Question data model

The active `Question` model supports:

- identity and hierarchy metadata;
- stage and skill labels;
- title and Markdown/LaTeX question text;
- marks;
- five declared answer types;
- one canonical answer and accepted-answer aliases;
- optional multiple-choice options;
- optional unit metadata;
- worked solution, final answer, hint and common mistake;
- calculator flag, source, readiness status and display order.

Only `numerical` and `algebraic` are used by the eight active Higher Maths questions. Multiple-choice rendering exists but has no active record exercising it. Written and multi-step rendering exists as guided self-check only. Units are present in the type but are not rendered or checked by the active answer workspace.

The legacy `StemForgeQuestion` model in `data/questions.ts` is incompatible with the active model. It uses fields such as `question`, `answer`, `answerUnit`, `difficulty` and structured solution steps. It also retains old stage and difficulty terminology. `data/question-registry.ts` bridges the two models by routing known Maths records to `QuestionWorkspace` and known Physics records to `QuestionPage`.

This bridge preserves old routes but creates a high-risk split: future changes to question behaviour must state explicitly whether they affect the active Maths engine, the legacy Physics demo engine or both.

## 7. Answer-checking flow

### Complete active attempt flow

1. `/question/[id]` reads the dynamic route parameter.
2. `getMathsQuestionById` searches the static Maths question array.
3. A Maths match renders `QuestionWorkspace`; a legacy Physics match renders `QuestionPage`; no match calls `notFound()`.
4. `QuestionAnswerInput` selects a native input by `answerType`.
5. Input is stored in page-local React state as one string.
6. Submit is disabled for a blank answer and after the first submission.
7. Numerical/algebraic/multiple-choice input is checked by comparing a normalised input string against each normalised accepted answer.
8. Written/multi-step input receives `isCorrect: null` and guided self-check copy rather than automatic correctness.
9. The attempt is appended to browser storage.
10. Submitted state reveals feedback, final answer, hint, worked solution and common mistake.
11. Incorrect automatically marked answers expose a retry action that clears local input/submission state.
12. Recommended progression is recalculated from the first unanswered question in stage order.
13. Next navigation moves to that question, or back to the skill path if all questions have an attempt.

### Normalisation genuinely supported

The active normaliser:

- lowercases;
- removes whitespace;
- treats Unicode minus as `-`;
- converts `pi` symbol to `pi`;
- converts superscript 2 and 3 to `^2` and `^3`;
- treats multiplication symbols as `*`, then removes all `*`;
- removes curly braces.

This makes values such as `5x^4`, `5*x^4` and `5x^{4}` equivalent when expected aliases are present.

### Supported versus advertised formats

| Format | Actual support |
|---|---|
| Exact text | Yes, after normalisation. |
| Integers | Yes, exact normalised string. |
| Decimals | Yes only when the exact decimal representation is accepted. `2`, `2.0` and `2.00` are different unless all are listed. |
| Fractions | Exact textual fraction only if listed; no equivalence to decimals or reduced fractions. |
| Algebraic expressions | Limited exact-form aliases; no symbolic equivalence, expansion, factorisation or term reordering. |
| Coordinates | No structured support; only exact text if manually listed. |
| Multiple fields | No. `multi_step` is one textarea with self-check. |
| Units | Field exists but active workspace does not render or validate it. |
| Trigonometric expressions | Only exact accepted strings after basic normalisation. |
| Multiple choice | UI and exact option-value comparison exist, but no active content verifies the flow. |
| Written answers | Captured, not automatically marked. |
| Multi-step answers | Captured, not automatically marked. |

### Refresh and navigation behaviour

- Refresh clears page-local answer, feedback, hint and solution visibility.
- The stored attempt remains and still contributes to progress.
- Returning to a previously attempted question does not restore the old answer or feedback.
- Navigating backwards resets local input because the question ID changes.
- Clearing browser storage removes all progress and attempt history.
- The pre-submit `Next Question` link allows moving forward without answering; this does not record completion.

### Fragile assumptions

- Correctness depends on content authors anticipating accepted string forms.
- Removing `*` makes implicit and explicit multiplication equivalent, but does not parse expression structure.
- Braces are stripped globally rather than interpreted mathematically.
- Numeric tolerance is absent.
- `correctAnswer` is not used directly for marking; authors must also include it in `acceptedAnswers`.
- There is no validation that multiple-choice options include an accepted value.
- There is no validation that automatically marked questions have non-empty accepted answers.

## 8. Progress-system flow

### Storage contract

- Key: `stemforge.localProgress.v1`
- Payload: a JSON array of `QuestionAttempt`
- Attempt fields: `questionId`, `skillPathId`, `stageId`, `isCorrect`, `answer`, `attemptedAt`
- `isCorrect` may be `null` for guided marking.

The key name includes `v1`, but the stored payload has no explicit schema version and there is no migration function.

### Read/write/update/reset

- `readAttempts()` parses the array, filters malformed top-level attempt records with `isQuestionAttempt`, and falls back to an empty array on errors.
- `saveQuestionAttempt()` appends an attempt; it does not replace older attempts.
- Progress calculations reduce history to the latest attempt for each question.
- `writeAttempts()` persists JSON and dispatches `stemforge:local-progress-updated` in the current tab.
- Client progress components also listen to the browser `storage` event for other tabs.
- `resetSkillPathProgress()` removes all attempts for one `skillPathId` after UI confirmation.

### Completion and accuracy rules

- A question is considered completed/attempted after any latest stored attempt, including an incorrect or unmarked attempt.
- Stage completion percentage = unique attempted stage questions / stage question count.
- Path completion percentage = unique attempted path questions / path question count.
- Accuracy = latest correct attempts / latest attempted questions.
- Retrying a question changes current accuracy according to the latest result while retaining raw historical attempts.
- Stage/path completion does not require correctness.
- There is no formal mastery algorithm.
- `masteryStatus` and some static progress fields exist in content data but are not the authoritative local-progress calculation.

### What is and is not stored

| Item | Stored? |
|---|---|
| Submitted answer | Yes |
| Correct/incorrect/unmarked result | Yes |
| Attempt timestamp | Yes |
| Multiple attempts | Yes, append-only history |
| Latest state per question | Derived |
| Hint opened | No |
| Worked solution opened/viewed | No |
| Time spent | No |
| Confidence | No |
| Error reason | No |
| Device/user identifier | No |
| Question content version | No |

### Data-flow diagram

```text
Question attempt
-> QuestionWorkspace.handleSubmit
-> exact-string answer result (true / false / null)
-> saveQuestionAttempt
-> read existing attempt array
-> append attempt
-> localStorage write: stemforge.localProgress.v1
-> custom progress-updated event
-> subscribed client component state version increments
-> getLatestAttempts + getStageProgress/getSkillPathProgress
-> page, path, question bank and dashboard re-render
```

### Device and user behaviour

Progress is device-, browser-profile- and origin-specific. All people using the same browser profile and origin share one progress array. Incognito sessions, another browser, another device, storage clearing or a different deployed origin do not share progress.

### Safest future replacement boundary

`lib/local-progress.ts` is the natural persistence boundary, but its current public functions mix synchronous storage access and derived progress calculations. Before adding a database, split conceptually into:

1. an attempt repository interface (`list`, `append`, `reset`);
2. pure progress derivation functions that accept attempts and content definitions;
3. a browser implementation retaining current behaviour;
4. later, a server/account implementation and guest-to-account merge policy.

The current exported function signatures are widely used and should be preserved or adapted behind a compatibility layer during that future sprint.

## 9. Component map

### Layout and navigation

| Module | Responsibility | Used by | Coupling/risk |
|---|---|---|---|
| `AppShell` | App background, sidebar and page offset | all internal app pages | High visual regression surface, low business logic. |
| `AppSidebar` | Primary app navigation and active-path card | internal app pages | Depends on global active-path helper; high navigation impact. |
| `AppTopbar` | Preview/account, notification and profile controls | internal pages | Presentational placeholders only. |
| `PageContainer` | Desktop sidebar offset and responsive padding | internal pages | High responsive-layout impact. |
| landing components | Public homepage sections | `/` | Mostly isolated from app logic except CTA helpers. |

### Learning paths and content

| Module | Responsibility | Business logic | Risk |
|---|---|---|---|
| `subject-learning-pages.tsx` | Generic subject/course/spec/skill templates | Registry lookup, locked-state gating and stage links | High: broad reuse and legacy handling. Missing data returns `null` rather than 404. |
| `HigherMathsHub` | Active subject entry and roadmap | Active path and local progress | High student-journey impact. |
| `SubjectRoadmapNavigator` | Client-side unit/spec/topic selection | Page-local indices and level | Medium: state is not represented in URL. |
| `TopicRoadmap` | Skill-path/resources/practice navigation | availability gating | Medium. |
| `LocalLearningPathSection` | Stage status and question entry | local progress and first-unanswered selection | High progression impact. |
| `LocalRecommendedNextAction` | Next unanswered question CTA | local progress | High progression impact. |
| resource section components | Render static typed resources | little business logic | Low to medium. |

### Questions

| Module | Responsibility | Business logic | Risk |
|---|---|---|---|
| `QuestionWorkspace` | Active attempt lifecycle and feedback | marking, saving, sequencing | Highest-risk active component. |
| `QuestionAnswerInput` | Select input UI by answer type | answer-type branching | High when adding new types. Contains unused placeholder exports. |
| `MathKeypad` | Cursor-aware plain-text maths entry | browser selection/cursor manipulation | Medium, especially mobile. |
| `MathContent` | Markdown and KaTeX rendering | rendering only | High content-display dependency; raw HTML is not enabled. |
| `QuestionPage` | Legacy Physics demo engine | separate legacy flow | High confusion risk if modified as though active. |

### Progress and data utilities

| Module | Responsibility | Risk |
|---|---|---|
| `lib/local-progress.ts` | Attempt persistence and progress derivation | Highest data-consistency risk. |
| `lib/learning-paths.ts` | Active constants, traversal, question/resource lookup and URLs | High fan-out; central future boundary. |
| `data/question-registry.ts` | Active/legacy question bridge | High dual-engine coupling. |
| `data/subjects-registry.ts` | Simple subject/course/spec lookup | Low, but duplicates traversal functions in `lib/learning-paths.ts`. |
| `data/higher-maths.ts` | Active hierarchy, UI copy, resources and duplicated stage definitions | High content coupling and file-size growth risk. |
| `content/questions/...` | Active question records | High correctness/content risk. |

### UI primitives and controls

- `Card`, `ButtonLink` and `ProgressBar` are shared low-level primitives.
- Native inputs/selects/buttons are styled directly in feature components.
- There is no external component library, form library or validation library.
- Feedback uses a placeholder `BETA_FEEDBACK_URL = "#"`; there is no feedback route or submission system.

## 10. State-ownership map

| State category | Current examples | Owner |
|---|---|---|
| URL state | question ID; static route hierarchy | App Router |
| Page-local state | question answer/submitted; search/filter; flashcard reveal; roadmap selection | individual client components |
| Shared React state | none | no global provider/store |
| Context state | none | none |
| Server state | none | none |
| LocalStorage state | question-attempt array | `lib/local-progress.ts` |
| Static imported data | subjects, paths, stages, resources, questions | `data/`, `content/` |
| Derived state | progress, accuracy, next unanswered question, availability | utilities + component renders |

### Duplicate and reconstructed sources of truth

- Active subject/path are global constants in `lib/learning-paths.ts` while subject metadata also contains availability.
- Stage definitions are duplicated under the active skill path and at Higher Maths subject level.
- Question ordering exists in stage `questionIds`, question-array order and `displayOrder`.
- Question hierarchy is repeated as human-readable names, ID fields and nested location.
- `data/subjects-registry.ts` and `lib/learning-paths.ts` provide overlapping traversal helpers.
- Static `progress`, `completed` and `questionsCompleted` values coexist with authoritative derived local progress.
- `masteryStatus: "Not started"` is static while attempts can change.

### Browser and hydration handling

Browser-dependent access is guarded with `typeof window` in the storage module. Client progress components pass an empty attempt array before `useHasMounted()` becomes true, preventing server/client markup from reading storage during hydration. This is a sensible current pattern.

There is no asynchronous server state, so conventional request race conditions are absent. Potential consistency issues instead come from multiple components independently subscribing to storage events and synchronously recalculating from storage. The custom event covers same-tab writes; the native `storage` event covers other tabs.

## 11. Testing and reliability status

### Current tooling

- Type checking: configured and passing.
- Lint: configured and passing.
- Production build: configured and passing.
- Unit tests: none.
- Integration tests: none.
- End-to-end tests: none.
- Coverage: none.
- CI: none.
- Automated deployment checks: none.
- Error boundary: `app/error.tsx` provides generic recovery and intentionally does not expose details.
- 404: `app/not-found.tsx` provides recovery navigation.
- Runtime logging: no application logging or monitoring service.

### Behaviour coverage

| Behaviour | Automated coverage |
|---|---|
| Route rendering | No; manually smoke-tested in this audit. |
| Question loading / missing ID | No; manually verified current IDs and 404. |
| Correct answer | No. |
| Incorrect answer | No. |
| Accepted-answer aliases | No. |
| Multiple choice | No active fixture/test. |
| Multi-field questions | Not supported. |
| Hint/solution visibility | No. |
| Progress saving/restoration/reset | No. |
| Stage/path completion | No. |
| Mobile navigation | No automated coverage; existing manual beta checklist only. |
| Duplicate IDs | No build-time validation. |
| Invalid content references | No build-time validation. |

The lack of tests is the main reason future backend or answer-engine changes are unsafe despite the current build being green.

## 12. Security and privacy observations

Concrete findings:

- No secrets, tokens or hard-coded credentials were found in runtime source.
- `.env` and `.env.local` are ignored.
- The only environment variable is public metadata configuration: `NEXT_PUBLIC_SITE_URL`.
- No user accounts, personal profiles, backend, cookies or payment data exist.
- LocalStorage contains submitted answers, correctness and timestamps. This is not highly sensitive in the current beta, but it is readable by any script running on the same origin and shared by users of the same browser profile.
- Markdown rendering does not enable raw HTML, reducing HTML injection exposure.
- User input is rendered as input value and stored as JSON; it is not injected with `dangerouslySetInnerHTML`.
- KaTeX/Markdown content is trusted static repository content, not student-authored content.
- No internal/admin routes or API routes were found.
- No external links currently transmit data. The feedback URL is only `#` and is a dead placeholder.
- Error details are not displayed to students, but there is also no runtime reporting channel.

Future authentication risks to address later, based on current design:

- do not trust client-computed correctness or progress for authoritative accounts;
- define guest-to-account merge semantics before syncing local attempts;
- stop storing multiple users' progress under one undifferentiated key once accounts exist;
- validate and authorise all server writes independently of route/client state.

## 13. Build and runtime results

### Commands run

```text
pnpm --version
node --version
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm build
HTTP smoke checks against the running development server on port 3022
```

### Results

- pnpm: 11.7.0
- bundled Node runtime used for checks: 24.14.0
- installed Next.js: 15.5.20
- dependency install: already up to date; passed
- TypeScript: passed
- ESLint: passed
- production build: passed; 22 static/dynamic pages generated
- test command: not available
- automated tests: not available

The following current routes returned 200 during smoke verification:

- `/`
- `/dashboard` and `/dashboard/demo`
- `/subjects` and `/subjects/demo`
- `/subjects/higher-maths`
- `/subjects/higher-maths/calculus` (redirected destination rendered)
- `/subjects/higher-maths/calculus/differentiation` (redirected destination rendered)
- `/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- all four Higher Maths resource/question-bank routes
- `/question`, `/question/demo` and sampled active question IDs from all three stages
- `/subjects/higher-physics` and retained valid locked Physics routes
- `/resources`

`/question/not-real` and `/not-real-route` correctly returned 404.

No audit code change was required to make these checks pass.

## 14. Fragile areas

1. **Question marking:** exact normalised strings can reject mathematically equivalent answers and has no tests.
2. **Dual question engines:** active Maths and legacy Physics use incompatible data models and components behind one route.
3. **Manual referential integrity:** stage/path/question relationships can silently disagree.
4. **Progress semantics:** any attempt means completion; mastery has no authoritative rule.
5. **Storage coupling:** synchronous browser storage and derivation share one module without an interface or migration.
6. **Static/derived progress overlap:** mock progress fields can disagree with LocalStorage-derived state.
7. **Missing-route handling in generic templates:** several template lookup failures return `null`, potentially producing blank successful pages rather than 404.
8. **Question order duplication:** array order, display order and stage question IDs can diverge.
9. **Route/data mismatch:** some content records contain routes that do not exist; some hierarchy routes redirect rather than render.
10. **Feedback placeholder:** visible feedback CTAs link to `#` and do not collect feedback.
11. **No regression suite:** build success cannot prove interaction correctness.
12. **Large central data file:** resources, navigation copy, stages and hierarchy are accumulating in `data/higher-maths.ts`.

## 15. Protected areas

Future sprints should modify these cautiously and with explicit regression checks:

- `components/questions/question-workspace.tsx`
- `components/questions/answer-inputs.tsx`
- `lib/local-progress.ts`
- `lib/learning-paths.ts`
- `data/question-registry.ts`
- `data/types.ts`
- active IDs in `data/higher-maths.ts`
- active questions in `content/questions/higher-maths/differentiation.ts`
- `components/learning/local-learning-path-section.tsx`
- `components/learning/local-skill-path-progress.tsx`
- dynamic `/question/[id]` dispatch behaviour
- `AppShell`, `AppSidebar` and `PageContainer` responsive behaviour

Protected student behaviour includes accepted-answer checking, attempt recording, latest-attempt progress, reset-by-path, next-unanswered selection, locked Physics gating and mobile navigation.

## 16. Technical debt

### Immediate structural debt

- No content schema validation command.
- No duplicate/reference validation.
- No answer-engine tests.
- No progress tests.
- No test runner or CI.
- No explicit content versioning.
- No persistence abstraction.

### Cleanup debt that should not block the next sprint

- Legacy/demo routes and components remain in the production route tree.
- Duplicate subject/registry traversal helpers exist.
- Subject-level and skill-level stage definitions are duplicated.
- Some exported answer subcomponents are empty placeholders.
- Generic templates contain hard-coded Basic differentiation copy.
- Breadcrumb implementation is inconsistent; some breadcrumbs are text-only.
- `demo` props often no longer change route behaviour meaningfully.
- The feedback URL remains a placeholder.
- Root metadata defaults to `https://stemforge.app` when deployment configuration is absent.

## 17. Recommended architectural boundaries

### Content boundary

Keep canonical content objects independent from page components. Add validation around the current TypeScript data before considering a database. One validated registry should resolve subject, course, topic, path, stage and question relationships.

### Answer boundary

Extract marking into pure functions by answer type. Preserve current normalisation as a tested baseline. Do not add symbolic algebra until required equivalence rules and test cases are agreed.

### Progress boundary

Separate attempt persistence from pure progress derivation. Preserve the current LocalStorage implementation behind an interface before adding remote storage.

### Navigation boundary

Generate canonical paths from content identity or validate stored `href` values against known routes. Avoid allowing content records to silently advertise missing routes.

### UI boundary

Keep page templates dependent on resolved typed data and progress view models, not directly on storage or active global constants where avoidable. Preserve the current muted blue design and strongest page baselines.

## 18. Proposed future sprint order

1. **Content schema hardening and validation**
   - Define canonical required fields and enums.
   - Validate duplicate IDs, missing references, question ordering, accepted answers, readiness status and route consistency.
   - Validate the eight current questions without changing their wording.
   - Decide whether import field `type` maps to `answerType` or the model changes before bulk import.

2. **Answer-engine test harness**
   - Extract current marking into pure tested functions.
   - Lock down exact current accepted/rejected examples.
   - Add numeric tolerance or algebraic equivalence only after product rules are explicit.

3. **Progress abstraction and tests**
   - Separate repository and derivation layers.
   - Add tests for repeat attempts, incorrect attempts, reset, refresh restoration and stage/path completion.
   - Add an explicit storage schema version and migration policy.

4. **Content import tooling**
   - Parse reviewed question-bank source into the validated schema.
   - Produce deterministic validation reports rather than directly publishing content.

5. **Database foundation**
   - Model attempts and content versions after local semantics are settled.
   - Keep guest-local behaviour working.

6. **Authentication and guest migration**
   - Only after account requirements and merge rules are decided.

7. **Feedback, analytics and admin tooling**
   - Add only with defined data minimisation, events and operational ownership.

## 19. Open product decisions

Repository evidence cannot decide the following:

- Will guest use remain available after accounts launch?
- Are accounts optional, recommended or mandatory?
- Does any submitted answer complete a question, or only a correct answer?
- Does a guided/self-checked written answer count as complete?
- What exactly completes a stage?
- What defines mastery: accuracy, completion, recency, repeated success or a combination?
- Do incorrect attempts reduce mastery, and for how long?
- Does viewing a hint affect scoring or mastery?
- Does viewing the worked solution affect scoring or mastery?
- Can students reset one question, one stage, one path or all progress?
- Should raw attempt history be retained indefinitely?
- What happens to progress when a question is edited, reordered, removed or versioned?
- Is question order fixed, adaptive or randomised?
- Does using notes, formula cards, examples or flashcards contribute to progress?
- Should accepted algebraic forms be author-curated, parser-generated or symbolically compared?
- What numeric tolerance and rounding rules apply?
- Should answers require units, and how are equivalent units handled?
- Is feedback anonymous, and what information may be collected from beta testers?

These decisions should be recorded before database schema or account migration work.

## 20. Final readiness assessment

Scores use 1 = not ready and 5 = strong readiness for the stated area.

| Area | Rating | Evidence | Main blocker |
|---|---:|---|---|
| Student-facing frontend readiness | 4/5 | Coherent active journey, responsive app shell, useful feedback and passing routes/build. | Remaining placeholder/demo surfaces and no automated interaction coverage. |
| Content scalability | 2/5 | Shared types and hierarchy exist; active records are data-driven. | Manual IDs/relationships, large nested files, no validation/import/versioning. |
| Answer-engine reliability | 2/5 | Current eight answers have explicit aliases and clear guided fallback. | Exact-string comparison, no numeric/symbolic equivalence and no tests. |
| Progress-system reliability | 3/5 | Guarded storage access, latest-attempt derivation, same/other-tab refresh and path reset are coherent. | Unsettled completion/mastery semantics, no migration/version payload and no tests. |
| Backend readiness | 2/5 | Content and attempts have identifiable boundaries. | No repository abstraction, server contract, schema or authoritative rules. |
| Authentication readiness | 1/5 | UI honestly states no account and no cloud progress. | No identity model, guest policy, merge rules, server storage or security design. |
| Testing maturity | 1/5 | Typecheck, lint and manual checklist exist. | No unit, integration, E2E, coverage or CI. |
| Deployment maturity | 3/5 | Production build passes, no required services, environment hygiene is sound. | No provider config, CI, monitoring or automated deployment smoke checks. |
| Private-beta readiness | 4/5 | Active path works, local-only limitations are disclosed, mobile layout is established and route checks pass. | Feedback link is placeholder and regressions rely on manual testing. |
| Public-launch readiness | 2/5 | Solid visual proof of concept and one complete slice. | Content breadth, marking reliability, persistence/account decisions, tests and operations are incomplete. |

### Final readiness conclusion

STEM Forge is ready to continue limited private testing with the current eight-question Higher Maths slice, provided testers understand that progress is browser-local and marking accepts only authored answer forms. It is not ready for broad content import, accounts or public launch.

### Recommended Sprint 2

**Content schema hardening and automated content validation** is the recommended next technical sprint.

It should add a repeatable validation command for the existing static content without redesigning pages or migrating storage. At minimum it should detect duplicate IDs, missing stage/path/question references, mismatched hierarchy metadata, invalid status/type values, empty accepted answers for auto-marked questions, missing source/solution fields and conflicting question order.

This sprint minimises rework because answer tests, import tooling, database tables and admin tools all need the same trustworthy content contract. Authentication should not be next.
