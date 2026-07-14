# STEM Forge SQA Taxonomy and Multi-Path Runtime

Updated: 14 July 2026  
Status: Sprint 11 implemented

## 1. Canonical hierarchy

The learner runtime now resolves `Subject -> Course area -> Specification strand -> Skill path -> Stage -> Question`. Higher Mathematics Calculus uses the six headings in the current official [Higher Mathematics course specification](https://www.sqa.org.uk/files_ccc/h-course-spec-mathematics.pdf). Official curriculum structure organises discovery; learner-sized paths remain the unit of practice, progress, completion and mastery.

## 2. Meaning of every level

- A subject is the qualification-facing product entry, such as Higher Maths.
- A course area is a broad area within that subject, such as Calculus.
- A specification strand is an ordered official curriculum heading used for navigation and recognition.
- A skill path is a stable, learner-sized sequence and the progress/mastery boundary.
- A stage is an explicitly ordered phase: Foundations, Applications or Past Paper-style Questions.
- A question is a stable assessable item owned by one path and one stage.

## 3. Why specification strands and skill paths differ

The specification headings are too broad to be coherent mastery units. A strand groups related paths but does not own attempts, completion or mastery. For example, Differentiating functions contains Basic differentiation, Chain rule and Trigonometric differentiation as separate paths. No specification-strand assessment version was introduced because the strand is navigational taxonomy, not an assessment boundary.

## 4. Stable identity rules

Subjects, areas, strands, paths, stages and questions use explicit stable IDs/slugs. Existing question, stage and path IDs and all existing production URLs are unchanged. Display labels and parent taxonomy may evolve without relabelling evidence. IDs must not be reused for unrelated content. Taxonomy-only changes do not increment question, stage or path versions.

## 5. Ownership resolution

`data/canonical-content.ts` is the production registry and `lib/content-resolver.ts` is the authoritative pure lookup boundary. It resolves questions upward through stage, path, strand, course area and subject, and paths downward to their active ordered questions. Unknown or contradictory relationships fail safely. Generic Higher Maths helpers no longer import the Basic Differentiation question file directly. Legacy Physics remains outside this resolver contract.

## 6. Ordering rules

Specification strands have explicit `order`; paths have explicit `displayOrder`; stages retain their canonical array order; and stage `questionIds` remain authoritative for question order. The runtime never relies on object iteration, question import order or global Maths-array position. Duplicate or invalid ordering fails validation.

## 7. Active/archive behaviour

Lifecycle filtering stays central in `lib/content-selectors.ts` and the resolver consumes active views for learner-facing operations. Archived parents cannot leak active children, archived stages/questions do not enter navigation, and unavailable but active metadata can appear honestly as coming soon. Historical question lookup remains separately available under the established version architecture.

## 8. Path-scoped sequencing

For a resolved question, the resolver returns its stage index, path index, previous question, next question, next stage and own-path completion destination. Stage and question order are canonical. Navigation cannot cross to another path, final questions return to their owning path, and missing ownership never falls back silently to Basic Differentiation.

## 9. Breadcrumb and context derivation

The question workspace derives subject, course area, official strand, path, stage, position and destinations from the resolved question context. Path routes resolve through the same contract. Breadcrumbs link to real subject, area, topic and path routes, wrap on mobile, and retain the existing invalid-question recovery. The subject badge is no longer fixed to Higher Maths inside the generic workspace.

## 10. Question-bank query contracts

`queryQuestionBank` is a pure rendering-independent contract. It searches subject, area, strand, path, stage, question skill/title and ID case-insensitively with normalized whitespace. It supports All, Not started, In progress, Completed and Review recommended filters; the three semantic stage filters; and default curriculum, recent activity, review priority and completion sorting. Results retain stable IDs and deterministic canonical order. Completed is not treated as Secure or Mastered.

## 11. Progress isolation

Progress inputs are keyed and derived at path/question boundaries. Query and dashboard derivations calculate totals from each resolved path only. The two-path fixture proves that activity in one path cannot change another path's completion totals, review count, sequence or destination. Persisted progress structures and semantics were not changed.

## 12. Compatibility and version decisions

Unversioned, V1, V2 and V3 payloads remain readable; canonical writes remain V4. Migration, snapshot, reset, evidence merge, acknowledgement and current-readiness rules are untouched. No learner evidence was rewritten. No existing question, stage or path version changed, because the new parent grouping and resolver do not alter assessment meaning or required structure.

## 13. Legacy Physics boundary

Higher Physics stays in its separate legacy schema and read-only/locked presentation. Its 15 questions remain unmigrated and continue to produce the one expected validation warning. The canonical Maths resolver does not pretend Physics has strand ownership, and no Physics IDs, routes, progress or behaviour changed.

## 14. Representative second-path proof

`tests/fixtures/multi-path-content.ts` defines a clearly test-only Basic integration path with three questions across two stages. It is injected into a fresh resolver and proves ownership, active selection, route context, stage boundaries, previous/next, final destination, archive exclusion, bank querying and progress isolation. These questions are never registered in production or exposed to learners.

## 15. Known limitations

Only Basic Differentiation has reviewed production questions. Planned paths are metadata-only and render a coming-soon recovery. The question bank is only minimally wired to the new query contract; its high-density/collapsible redesign is intentionally deferred. The homepage/dashboard still use an explicit current beta entry point, while their underlying summaries can now be derived generically. There is no authoring/import tool, database, account, sync or analytics layer.

## 16. Exact steps to add a real future path

1. Complete educational review of its strand mapping and learner scope.
2. Add or confirm stable path metadata under the appropriate canonical strand, including explicit order, lifecycle, URL and path version.
3. Add stable stages with explicit ordered question IDs and stage versions.
4. Import reviewed questions with stable IDs, path/stage ownership, versions, revisions, lifecycle, answers and source metadata.
5. Register the question module once in `data/canonical-content.ts`; do not add component-specific imports.
6. Run content validation and add focused content, resolver, query, progress and browser coverage.
7. Review version-policy implications, route behaviour, mobile context, completion destination and archive safety.
8. Publish only after content and educational review; change availability from coming soon only when the complete path is learner-ready.

## 17. Open educational mapping questions

Differential equations needs explicit review: elementary solving fits the official Integrating functions heading, while rate/initial-condition applications can overlap Applying integral calculus. The current metadata places the planned path under Integrating functions and does not claim final educational approval. Mixed differentiation practice is grouped under Differentiating functions; its long-term role and whether it should remain a distinct mastery path should also be reviewed before content import.

## 18. What Sprint 12 may safely import

Sprint 12 may perform one controlled, reviewed Higher Maths path import through the canonical registry and resolver, preserving stable existing IDs and V4 evidence rules. Chain Rule, Trigonometric Differentiation and Stationary Points banks were deliberately not imported here. Sprint 12 must not treat metadata availability as publication, invent strand versions, migrate Physics, rewrite progress, or bypass validation. The safest first import is a path whose mapping, stage structure, versions and reviewed question bank are already unambiguous.
