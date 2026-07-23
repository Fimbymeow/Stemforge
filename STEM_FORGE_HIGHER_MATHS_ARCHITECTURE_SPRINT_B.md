# STEM Forge — Higher Maths Course Architecture (Sprint B)

## Baseline and scope

- Baseline: `431205a` (`Complete dashboard and navigation architecture sprint`)
- Source of truth: Qualifications Scotland/SQA Higher Mathematics course specification, course code `C847 76`, version 3.0, May 2023.
- Scope: curriculum taxonomy, honest planned coverage, course navigation, validation and regression coverage.
- Excluded: new questions or learning content, Question Bank redesign, selected-question practice, progress migrations, Reasoning metadata, Sprint C, commit and push.

## Final course architecture

Reasoning remains an embedded, cross-cutting capability. It is not a fifth CourseArea and no speculative Reasoning fields, filters or lessons were added.

| CourseArea | SpecAreas | SkillPaths |
| --- | --- | --- |
| Algebra and Trigonometry | Polynomials | Factorising cubics and quartics; Polynomial equations; Discriminant and nature of roots; Quadratic inequalities; Completing the square with a non-unit leading coefficient |
|  | Logarithms and Exponentials | Laws of logarithms and exponents; Logarithmic and exponential equations; Logarithmic and exponential modelling |
|  | Functions and Graphs | Graph transformations; Sketching derivative graphs; Inverse logarithmic and exponential graphs; Composite functions; Inverse functions, domain and range |
|  | Trigonometric Skills | Addition and double-angle formulae; Trigonometric identities; Wave-function form; Solving trigonometric equations |
|  | Intersections | Intersections of lines and curves |
| Vectors | Vector Connections | Vector pathways and resultants in three dimensions; Collinearity; Internal division of a line |
|  | Vector Operations | Unit vectors and the i, j, k basis; Scalar product and angle between vectors; Scalar-product properties and perpendicularity |
| Calculus | Differentiation | Basic differentiation (live); Chain rule; Trigonometric differentiation; Stationary points; Nature of stationary points; Tangents and normals; Optimisation; Mixed differentiation practice; Increasing and decreasing functions; Graph sketching using calculus |
|  | Integration | Basic integration; Further integration; Definite integrals; Differential equations; Areas using integration |
|  | Applying Calculus | Greatest and least values on closed intervals; Rates of change; Reconstructing a function from a rate and initial conditions |
| Lines, Circles and Sequences | Straight Lines | Parallel and perpendicular lines; Gradient and angle; Medians, altitudes and perpendicular bisectors |
|  | Circles | Equation of a circle; Tangency to a circle; Line-circle intersections; Circle-circle intersections |
|  | Sequences | Recurrence relations; Limits of sequences |

The final Higher Maths tree contains four CourseAreas, 13 SpecAreas, 17 official SpecificationStrands and 51 SkillPaths. One path is published and 50 are honest placeholders.

## Official specification mapping

Every SkillPath resolves to a SpecificationStrand declared by its parent CourseArea. The new stable strand identifiers cover:

- Algebra and Trigonometry: polynomial expressions and equations; logarithmic and exponential skills; functions and graphs; trigonometric skills; intersections; modelling.
- Vectors: vector connections in three dimensions; vector operations and scalar product.
- Calculus: differentiation; differentiation applications; integration; integration applications; optimisation and extrema; rates and reconstruction.
- Lines, Circles and Sequences: straight lines; circles; sequences.

Existing Calculus strand IDs and all existing SkillPath mappings remain unchanged. In particular, Sketching derivative graphs maps to the official algebraic/trigonometric coverage, while Optimisation remains under its existing teaching-route parent and retains its independent official mapping.

## Preservation and additive changes

All 13 pre-Sprint-B Calculus paths were preserved in place with the same IDs, slugs, parents and routes. This includes:

- live Basic differentiation and its eight versioned questions;
- Chain rule, Trigonometric differentiation, Stationary points, Nature of stationary points, Tangents and normals, Optimisation and Mixed differentiation practice;
- Basic integration, Further integration, Definite integrals, Differential equations and Areas using integration.

Thirty-eight new unavailable SkillPaths were added: 18 in Algebra and Trigonometry, six in Vectors, five in Calculus and nine in Lines, Circles and Sequences. No question ID, version, content revision, CourseArea ID, existing SpecArea ID, SpecificationStrand ID, SkillPath ID/slug, stage ID, route, progress identity, resource relationship or stored evidence format changed.

`Areas using integration` remains one placeholder. Optimisation was not moved. No migration or alias was required.

## Placeholder honesty and progress evidence

The shared placeholder factory produces unavailable, coming-later paths with:

- zero questions and zero completed questions;
- zero progress;
- no stages or question references;
- no resources or practice sets;
- no recommended action or active learning CTA;
- a parent hub destination rather than a fake workspace.

Content validation now fails for invalid parent hrefs, duplicate path slugs, missing strand references, available zero-question paths, availability/status disagreement, non-zero placeholder progress or question counts, placeholder stages/questions, placeholder resources/practice sets, and placeholder recommendations.

Unavailable SkillPath routes return not found rather than rendering an empty learning workspace. CourseArea and SpecArea hubs remain browsable for orientation.

Progress, mastery, achievements, recommendations and practice continue to use published content only. Regression coverage proves that:

- the existing Basic differentiation denominator remains eight;
- an existing learner's percentage is unchanged by the expanded taxonomy;
- all-live-content-complete remains 100% when the eight published questions are complete;
- placeholders cannot enter dashboard recommendations, practice selection, mastery summaries or completion denominators.

## Learner-facing navigation

The Higher Maths hub now explains the whole course through four broad cards, labels Calculus as partially available, keeps the live Basic differentiation action prominent and states that progress covers published content only.

Generic reusable CourseArea and SpecArea routes now provide:

- correct breadcrumbs and main landmarks;
- clear published-versus-planned states;
- prioritised live content;
- quiet planned coverage without misleading percentages, study times, resources or question counts;
- accessible labelled destinations.

The existing static Calculus routes now use the same generic presentation. Existing deep links to Calculus, Differentiation and Basic differentiation continue to resolve.

The roadmap availability signal now depends on a published child path, not merely the existence of placeholder children.

## Question Bank compatibility

The active Question Bank experience and eight live questions are unchanged. Zero-question paths are excluded from active query/filter results even when the progress filter is `all`.

Future coverage remains a secondary collapsed disclosure and is grouped by CourseArea and SpecArea rather than rendered as a 50-row flat list. No selection system, compact-row redesign, pagination, virtualisation, custom practice or two-pane layout was added.

## Responsive and accessibility evidence

Automated Chromium geometry checks cover the Higher Maths hub, representative CourseArea hub, representative SpecArea hub, Question Bank and live path at:

- 1440×900
- 1024×768
- 390×844
- 360×800
- 320×568

The initial 320px investigation identified the exact overflow source: the roadmap's intentional `min-w-max` horizontal icon row propagated intrinsic width through a newly introduced wrapper without minimum-width containment. Adding `min-w-0 max-w-full` to that shared wrapper removed document overflow while retaining the intentionally scrollable roadmap and all four mobile navigation destinations.

The new hubs retain one main landmark, breadcrumb navigation, semantic headings, labelled links and readable status text. Ordinary and auth-enabled browser suites reported no page or console errors. Manual in-app Chromium inspection confirmed the desktop hierarchy and navigation; the only console message was the existing development-only logo LCP advisory.

## Tests added and updated

Added:

- `tests/higher-maths-architecture.test.ts`: seven taxonomy, identity, placeholder, progress and recommendation assertions.
- `e2e/higher-maths-architecture.spec.ts`: four architecture/route scenarios plus five responsive geometry scenarios.

Updated:

- taxonomy test script to include the new architecture suite;
- existing fixtures/tests that incorrectly assumed Calculus was array position zero, replacing that incidental assumption with stable ID lookup;
- expected planned-path totals and unavailable-path behavior;
- Question Bank query expectations so unavailable zero-question paths never count as active;
- the mobile future-coverage count;
- one existing asynchronous draft assertion to wait for visible successful marking before inspecting post-submission storage.

No assertion was weakened. The draft change removes a timing race: clicking starts asynchronous evidence persistence, while visible correct feedback is the stable completion boundary.

## Exact verification results

- Content validation: 0 errors; one expected legacy Higher Physics schema warning.
- Taxonomy tests: 14/14 passed.
- Question Bank tests: 7/7 passed.
- Content tests: 23/23 passed.
- Practice tests: 16/16 passed.
- Complete unit/integration suite: 329 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed.
- Focused Higher Maths architecture Playwright: 9/9 passed.
- Complete ordinary Playwright: 116/116 passed.
- Auth-enabled navigation/hydration Playwright: 5/5 passed, including 320px four-item navigation.
- P7 cross-browser hardening: all three engines passed earlier in the fail-fast complete gate. On the final rerun, Chromium passed 1/1 and WebKit passed 1/1; Firefox timed out during browser launch before the test began because its Windows headless SWGL renderer could not map the default framebuffer. No Firefox product assertion ran or failed in that final attempt.
- Changed-file secret scan: no credential pattern or environment file included.
- `git diff --check`: passed.

The repository runtime reports Node 24 while `package.json` requests Node 22.x; this is a pre-existing environment warning and did not affect verification.

The latest Firefox launch limitation is environmental and should be rechecked on a clean Node 22/Playwright runner before release, although the same test and engine passed earlier in this work session.

## Files

Created:

- `data/higher-maths/placeholder.ts`
- `data/higher-maths/algebra-trigonometry.ts`
- `data/higher-maths/vectors.ts`
- `data/higher-maths/lines-circles-sequences.ts`
- `app/subjects/[subjectSlug]/[courseAreaSlug]/page.tsx`
- `app/subjects/[subjectSlug]/[courseAreaSlug]/[topicSlug]/page.tsx`
- `tests/higher-maths-architecture.test.ts`
- `e2e/higher-maths-architecture.spec.ts`
- this report

Modified:

- Higher Maths canonical data, hub, generic learning pages, roadmap components and Question Bank compatibility.
- unavailable SkillPath route boundary and the two existing static Calculus route wrappers.
- content validation and Question Bank query logic.
- package test composition and focused regression fixtures/tests needed for stable-ID lookup and expanded totals.

Deleted: none.

Generated `.next`, Playwright report/results and TypeScript build-info changes are not part of the Sprint B diff.

## Deferred Sprint C work and residual taxonomy questions

Deferred exactly as requested:

- Question Bank redesign, compact rows, question selection, custom practice, pagination, virtualisation and two-pane navigation;
- Reasoning metadata, filters, lessons and achievements;
- all new questions, explanations, worked solutions and resources;
- any progress, mastery, review or marking change.

Residual decisions should be made only when real content is authored:

- whether Areas using integration should eventually split into axis/curve-area teaching paths;
- whether trigonometric degree/radian work needs separate stages;
- whether coordinate/component notation needs a separate vector teaching path;
- whether any broad path becomes too large after question authoring.

These questions do not block the current architecture.

## Commit readiness

The deliberate Sprint B diff is coherent and safe to commit after review. No commit or push has been performed.

Recommended commit message:

`Complete full Higher Maths course architecture sprint`

## Student-facing summary

Higher Maths now shows the shape of the full course without pretending unfinished lessons are ready. You can still go straight to Basic differentiation, see which areas are coming later, and trust that your progress only measures real questions you can actually complete.
