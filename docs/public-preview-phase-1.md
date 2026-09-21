# Public Preview Phase 1 — runtime foundation

## Boundary and state

The root layout delegates provider composition to `RuntimeBoundary`. Exact `/demo` and `/demo/*`
routes mount only `DemoRuntimeProvider`; production auth availability, Premium Preview, progress sync
and account-state sync providers are siblings in the other branch, never preview ancestors.
Unknown pathname renders nothing (fail closed). Normal routes retain the original provider order and
implementations. `/dashboard/demo` remains an ordinary product route, not this public preview.
Middleware only matches `/account/*` and `/auth/*`; demo server pages use static canonical content,
not cookies, owner resolution, APIs or database modules. Existing auth cookies are neither used nor removed.

Each preview provider creates an empty, private in-memory V7 `ProgressRepository`. Attempts and
support events use canonical versions and existing calculations/achievement derivations. Drafts and
completion acknowledgements reuse existing validators/stores against a private memory map. No
browser storage is accessed; no production keys are swapped. Reset clears only that instance. Reload
or a new tab starts empty. Optional sessionStorage persistence is deliberately not implemented.

Chain Rule membership is derived through the active canonical resolver, asserting `higher-maths`,
`chain-rule`, question ownership and stage membership. Unknown, archived, other-skill and legacy IDs
fail closed. Navigation helpers return only demo routes; invalid question IDs have no destination.
The real Notes renderer receives an explicit contained continuation destination.

`LearningRuntime` supplies the narrow learning I/O contract and destinations; `productionLearningRuntime`
delegates to unchanged ordinary implementations. It is a seam for Phase 3, not a replacement of current
global repositories. The demo deliberately does **not** mount `QuestionWorkspace`, `AppShell`,
`AppTopbar`, ordinary skill-progress components, sync status, reporting or account UI.

## Question Workspace side-effect audit / Phase 3 integration checklist

The existing ephemeral flag is not a preview boundary. Before reusing the full workspace, all these
surfaces must use the injected runtime and preview-safe presentation/navigation:

| Interaction | Current production surface | Preview destination |
| --- | --- | --- |
| Open/hydrate/render | `getSkillPathProgress`, `getQuestionProgress`, draft restore | Runtime evidence/progress and private draft methods |
| Subscribe/refresh | production progress/storage events | Runtime subscription only |
| Type/normalize | plain/rich draft saves via browser storage | Runtime draft methods; same bounded normalizer |
| Submit | local attempt transaction, provenance, mistake-resolution reads, draft clear | Runtime attempt/evidence/drafts; same marker and classification |
| Hint | support event recording | Runtime hint recording |
| Solution | support write, after-attempt gating, assisted completion | Runtime solution/support evidence; preserve gating |
| Guided self-check | direct self-assessment write, session callbacks | Runtime self-assessment and isolated session ownership |
| Completion crossing | path/stage celebration stores | Runtime acknowledgements; isolated completion presentation |
| Change question | draft identity, reset, progress snapshots | Runtime scoped content/drafts/subscriptions |
| Next action | `useLearnerNextAction` reads ordinary evidence and practice sessions | Scoped deterministic calculation and demo destinations |
| Previous/breadcrumb/resources/completion actions | product routes and completion panels | Contained navigation adapter, no ordinary panels |
| Notes return | `stemforge:working-context-notes-origin:*` session entries | Preview-local navigation, no production origin entries |
| Chrome/help/reporting | AppShell, AppTopbar, ReportDialog, formula/resources | Preview-safe chrome; no reports/account/Premium hooks |

Persistence inventory inspected includes progress, answer drafts, path/stage celebrations, practice
sessions, working-context Notes origin, learner preferences, onboarding, confidence, Study Plan,
Premium Preview, account-state sync, progress sync/import metadata, evidence provenance, erasure
receipts and guest-import/protection state. These must stay out of preview imports/mounted components.

## Scope and limitations

The question page is a minimal isolation probe using the real shared answer input, maths renderer,
normalizer, marker and feedback classifier. It records only genuine interactions. It is not the final
workspace or curated walkthrough. Full support/guided UI, final re-entry/recommendation UX, banners,
share metadata, noindex, deployment/domain work, analytics and visual polish are deferred.

Tests simulate pre-existing authentication cookies and available authenticated API responses, rather
than connecting to a real account/database. Production-origin requests already initiated before a
client-side switch are not preview requests; this foundation does not redesign production sync cleanup.
Public entry links should use a document navigation from production when added in a later phase.
