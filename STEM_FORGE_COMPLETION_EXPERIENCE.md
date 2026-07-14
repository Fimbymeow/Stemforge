# STEM Forge Completion Experience

Updated: 13 July 2026  
Scope: browser-local acknowledgement of Basic differentiation path completion

## Purpose

The completion experience gives a restrained, one-time acknowledgement when a student genuinely moves from an incomplete skill path to a complete one. It does not calculate or persist learning progress. Completion, mastery, review recommendations, accuracy and progression continue to derive from the protected progress/mastery model.

## Trigger

The full panel appears only when the current path changes from fewer than all required questions complete to all required questions complete. Opening an already-complete question, refreshing, revisiting, or completing a non-final requirement does not trigger it. The transition can result from a correct answer or from deliberately viewing a worked solution after a genuine attempt, in accordance with the existing completion rules.

## Variants

The displayed variant is derived from `getSkillPathProgress` at the transition:

- **Completed:** every required question is complete, but Secure/Mastered thresholds are not met.
- **Secure:** the path is complete and weighted mastery is at least 75%.
- **Mastered:** the protected path mastery, independent-performance and Past Paper-style requirements are met.

No acknowledgement value can promote or demote these states.

## Review Recommended

The panel and permanent completed-path card display Review Recommended when the derived path progress contains review question IDs. The primary action opens the first derived review question. Supported completion remains complete, but is not presented as independent mastery.

## Later mastery upgrades

When an already-complete path later improves from Completed to Secure, Completed to Mastered, or Secure to Mastered, the path page shows a smaller, dismissible acknowledgement. It does not replay the full completion panel. Equal or downward status changes are not treated as upgrades.

## Replay prevention

The acknowledgement layer records the stable logical path ID when the full completion moment is claimed. Refresh and revisit do not create an incomplete-to-complete transition, and an existing path acknowledgement also prevents a later accidental replay. A mastery tier is acknowledged when its upgrade banner is first made available. Neither acknowledgement auto-dismisses.

## Storage key and payload

The separate LocalStorage key is:

```text
stemforge.pathCelebration.v1
```

Its internally versioned payload is:

```ts
{
  version: 1,
  data: {
    paths: {
      [stablePathId]: {
        celebratedAt: string, // valid ISO-compatible date/time
        lastAcknowledgedStatus: "completed" | "secure" | "mastered"
      }
    }
  }
}
```

The original unversioned direct path map remains readable and migrates to this wrapper on the next successful mutation.

## Storage safety and isolation

Malformed JSON, arrays, missing wrapper fields and invalid path records fail safely without crashing rendering or changing progress. A later genuine acknowledgement can repair malformed current data. Valid unrelated path records are preserved during repair and mutation. Unknown path IDs are retained because lookup is intentionally content-agnostic.

Unsupported future wrapper versions are read as unknown and never overwritten, cleared or downgraded. Because their acknowledgement meaning cannot be interpreted safely, the transient panel is conservatively suppressed for that storage state; real progress and the permanent completed-path state still work.

## Reset

The existing confirmed path reset clears progress for that path using the protected repository, then separately attempts to clear that path's completion and mastery acknowledgements. A failure in acknowledgement cleanup cannot block or undo the progress reset. Other path acknowledgements remain intact. With a supported current/legacy store, a later genuine re-completion can be celebrated once again.

There is no new reset UI and no global acknowledgement clear in the student journey.

## Reduced motion and accessibility

The existing `prefers-reduced-motion: reduce` rule reduces completion animation and transition durations to a negligible single iteration. All information remains present as text and does not depend on motion or colour.

The inline completion panel uses `role="status"` and `aria-live="polite"`. It does not steal focus, trap focus, or auto-dismiss. The primary and secondary actions remain ordinary keyboard-focusable links. Status tiers and Review Recommended are conveyed in text.

## Browser coverage

`e2e/completion-experience.spec.ts` covers:

- genuine final-question completion and non-final suppression;
- refresh and revisit replay prevention;
- Completed with Review Recommended, Secure and Mastered;
- question/dashboard/hub/path consistency;
- later mastery-upgrade acknowledgement;
- path-specific reset and re-completion;
- reduced motion and keyboard access;
- malformed, partially invalid and unsupported future acknowledgement data.

`e2e/mobile.spec.ts` covers the final completion flow at 390 x 844, stacked actions, primary-action access and horizontal overflow. All tests use isolated Playwright contexts and production LocalStorage keys, with unexpected page/console errors treated as failures.

## Stable IDs and future content versions

Acknowledgements are keyed by stable logical path ID. Renaming a path without changing that ID retains acknowledgement. Harmless content revisions do not automatically replay completion. Archived or unknown paths do not crash lookup.

Sprint 9 V4 progress migration, event identities, question-version evidence, and structural snapshots do not alter this store or replay completion. A future major path version may explicitly choose to permit a new acknowledgement, but that decision remains deferred and must never make this store a source of progress truth.

## Known limitations

- Acknowledgements are local to one browser and device.
- Unsupported future acknowledgement data is preserved but cannot be selectively reset by older code.
- Storage denied by the browser allows the current genuine completion moment to display, but cannot guarantee replay prevention across later sessions.
- Cross-browser visual and assistive-technology audits remain outside this focused Chromium regression suite.
- Content-version-aware replay is deliberately deferred.

## Commands

```powershell
pnpm run test:completion
pnpm run test:e2e:completion
pnpm run test:e2e:desktop
pnpm run test:e2e:mobile
pnpm run test:e2e
pnpm run test:all
```
