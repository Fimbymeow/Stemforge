# STEM Forge Working Context Architecture

## Purpose

Working Context keeps a learner oriented inside one available skill path. It provides a compact Current Path control on question, path, Notes, and path-scoped Practice routes; a stable path overview; and direct learning intents on the Higher Maths hub.

It is a navigation and continuity layer. It does not create a second progress system.

## Browsing and Working

Browsing surfaces help a learner choose a subject, course, topic, or path. Working surfaces begin after a canonical path is known and keep that path available without displacing the learning task. The canonical overview remains a voluntary map of the skill, not an inserted step between an intent and a question.

## Source of truth

The model in `lib/working-context.ts` is derived from:

- canonical subject, path, stage, question, and resource records;
- the existing V4 local progress evidence;
- the existing active practice-session store;
- the existing version-aware progress calculations and next-action policy.

There is no Working Context progress key, resume pointer, seed fixture, or browser-only completion flag. Signed-in learners continue to receive the same evidence import and synchronization behavior because the feature reads the already synchronized evidence.

There is currently no separate Last Active Skill pointer. Dashboard resume is derived from the existing meaningful evidence and active-practice selectors. This avoids a device-local claim that could conflict with synchronized evidence. If a future pointer is required, it must remain separate from current-tab route context and update only after meaningful work.

## Route activation

Context is resolved at a trusted route boundary:

- question routes use the canonical question-to-path relationship;
- path overview routes pass the canonical path slug;
- Higher Maths Notes use the available Basic differentiation path;
- Practice accepts a validated `path` query solely to preselect and display a canonical path;
- practice sessions recover their path from the stored canonical question reference.

Dashboard and general browsing routes retain ordinary global navigation. They do not display a duplicate contextual control.

The inactive mobile Path destination remains the existing canonical learning-path destination. This is provisional and must be reviewed before a second fully supported subject launches; no broad multi-path product area is implied.

## Meaningful activity policy

Opening a page, expanding Current Path, reading a stage list, or selecting Practice does not create learning evidence. Attempts are recorded only through the existing answer workflow. Hint and worked-solution events continue to use the existing support-event boundary. Starting a practice session continues to use the existing practice-session store.

This means Start is a recommendation, not a fabricated resume position. Continue appears only when evidence or a genuine active practice session supports it.

## Continue and Review decisions

`deriveSkillPathNextAction` applies the existing deterministic next-action rules within one canonical path. Current-version unfinished work is preferred, then the next incomplete question, then real review evidence, then practice after completion.

Review uses the existing review and version-reassessment sets. The interface links to a contextual re-attempt of the first genuine due question and shows the real due count. It does not maintain a separate queue and never claims that review is due without evidence.

## Dashboard semantics

The Dashboard continues to use the existing evidence-derived global recommendation. Working Context does not add another Dashboard card or claim a separate cross-device resume capability. Cross-device continuity remains a property of the authenticated evidence synchronization system.

## Notes continuity

Question-to-Notes links carry only a validated question identifier, displayed question number, and a short origin token. A session marker permits safe browser-history return when the immediately previous entry matches; otherwise Notes returns to the explicit canonical question URL. No learning attempt is created by reading Notes.

## Responsive and accessibility behavior

On desktop, Current Path expands inline in the application navigation. At smaller widths it opens a modal sheet with:

- a labelled dialog;
- initial focus on the close control;
- focus containment;
- Escape dismissal;
- background inertness and scroll lock;
- focus restoration to the trigger.

All navigation actions remain ordinary links and retain visible focus treatment. The existing skip link remains the first keyboard route to main content. The contextual control follows the existing application navigation in DOM order; this is a known structural constraint of the current shell, not a new learner-state dependency.

## Fallbacks and validation

Unavailable or unknown path identifiers do not activate Working Context. Invalid canonical path routes retain the existing not-found response. A missing client model falls back to ordinary Subjects navigation. Practice ignores invalid path parameters and keeps its existing default selection.

Basic differentiation is the first complete production instance. The adapter uses the existing taxonomy and can represent another available canonical path without introducing a global active-path store, but no unavailable content is presented as supported. First-entry discovery is deliberately deferred: Current Path starts collapsed everywhere, and alpha testing should confirm whether non-question discovery needs a small local-only cue.

## Verification

Focused unit coverage proves fresh, returning, stage-transition, completed, review, parsing, and URL-helper behavior. Production-route browser coverage proves desktop and mobile navigation, real evidence updates, Notes return, path-scoped Practice, Dashboard non-duplication, invalid-path fallback, modal focus, and the absence of an activation query.
