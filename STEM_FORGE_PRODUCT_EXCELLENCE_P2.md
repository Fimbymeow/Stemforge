# Product Excellence Sprint P2 - Functional Honesty

## Scope

Sprint P2 corrects visible student controls and choices that did not match their current behaviour. It does not add content, redesign the application, or change marking, mastery, progress, authentication, ownership, import, synchronization, or reporting contracts.

## Verified defects and decisions

- The two Formula Sheet links on the legacy Higher Physics demo led to the unfinished `/resources` page. The active Higher Maths question workspace did not contain this control. Both legacy links now lead to the existing Higher Maths formula-card browser.
- `/resources` duplicated the working Higher Maths resource browser with a coming-soon stub. The URL is retained as a redirect to `/subjects/higher-maths/formula-cards`; the stub component is retired.
- A completed practice session's Retry incorrect action returned to generic setup. It now creates an untimed retry session containing only that completed session's incorrect, version-pinned question references in their original order. Construction creates no attempts or progress evidence. The separate global retry-incorrect mode keeps its existing latest-current-version meaning.
- Notifications and Profile preview looked interactive but had no action. They are removed rather than connected to placeholder features.
- Subjects, Higher Maths, Question Bank, and Higher Maths resources nested a second `main` inside the shared application `main`. Their inner layout containers are now neutral elements, leaving one primary landmark.
- Weekly evidence displayed zero Days, Attempts, and Milestones to a learner with no weekly activity. The explanatory empty-state sentence remains, while the zero-only statistic grid is omitted. Milestones are also omitted when achievement count is zero.
- Practice required Course and Path selections when each set contained one option. Those controls now appear only when multiple valid options exist. Mixed practice appears only with multiple available paths. Needs-work and global retry modes remain visible but disabled with their existing explanatory empty reasons when they cannot produce a session.

## Accessibility and responsive behaviour

Removing the dead topbar buttons eliminates misleading accessible labels. App routes retain one primary `main` landmark, the shared skip target remains unchanged, disabled practice choices communicate their unavailable state semantically, and the existing responsive layouts remain in place.

## Verification focus

Focused coverage verifies the canonical resource redirect and Formula Sheet destination, exact completed-session retry identities and ordering, absence of retry after a fully correct session, removal of dead topbar controls, one-main landmark structure, omission of zero-only weekly statistics, single-option practice omission, future multi-option visibility, mobile layout, keyboard focus, and zero unexpected browser/page errors.

## Explicitly deferred

Dashboard consolidation, global navigation changes, copy cleanup, progression or achievement redesign, stage celebrations, adaptive keypad work, progressive worked solutions, wrong-answer diagnostics, account/sync UX changes, beta operations, new content, premium, payments, AI, analytics, and prefetching remain outside Sprint P2.
