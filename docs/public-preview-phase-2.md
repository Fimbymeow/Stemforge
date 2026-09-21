# Public Preview Phase 2 — composition and contained navigation

The Phase 1 runtime/provider boundary is unchanged. No production-to-demo SPA entry links are added.
Future entry links must use full document navigation; request cancellation is not part of this phase.

The preview reuses the Orthic wordmark, shared Card, maths renderers, complete native Chain Rule
LessonRenderer and existing motion utilities. Production Dashboard/skill orchestration components are
not mounted because they read learner preferences, confidence, progress, recommendations and account
state. Demo-specific shell, hero and pathway pieces reproduce the V2 presentation without those hooks.

Navigation is only Overview, Chain Rule and Reset preview. Preview identity and the truthful
"No account required · Preview activity is temporary" line persist around all routes. Reset calls the
existing isolated runtime only, with an accessible live announcement. Memory-only evidence starts empty,
survives contained client navigation and is discarded on document reload. No seeded progress, activity,
confidence, prerequisite completion or Review state is shown.

The pathway derives Notes plus the active canonical stages and their allowed question counts through
the resolver (currently 10 / 9 / 15). Counts mean content availability, never completion. Stage names
remain unchanged internally; learner-facing PPQ is Exam practice. Mobile stacks the four steps vertically.
Basic differentiation is mentioned only as assumed familiarity, without a link or gate.

Notes content and its native lesson object are unchanged. The surrounding Back link points to the demo
skill, and the LessonRenderer continuation explicitly points to the first allowed Foundations question.

The earlier Phase 1 answer-entry probe is replaced in the visible preview by a read-only canonical question
shell, a truthful next-step message and useful contained return/Notes actions. The Phase 1 runtime attempt,
support and draft APIs and isolation unit tests remain in place. Full workspace mounting, answer submission,
support persistence UI, walkthroughs, activity recap and share/deployment metadata remain Phase 3/4 work.
