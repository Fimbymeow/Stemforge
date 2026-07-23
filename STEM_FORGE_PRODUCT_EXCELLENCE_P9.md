# STEM Forge Product Excellence P9

Phase II — Product Excellence, Sprint P9. Baseline: `58e2532` (`Complete Sprint P8 practice and resource coherence`). Scope: make account, import, sync, authentication failure, and return-to-learning states understandable and subordinate to study. Authentication, ownership, evidence, import, sync, local-first, and account-data protocols remain unchanged.

## 1. Initial account-confidence audit

The account architecture was materially stronger than its presentation. Import was explicit and idempotent, sync required separate association, ownership was server-resolved, and local evidence survived failure. The main confidence defects were lost learning destinations, contradictory connection labels, absent account identity, dense operational presentation, duplicated status language, and one inaccurate password-handling claim.

## 2. Existing account capabilities

STEM Forge supports optional email/password accounts, provider email verification and recovery, explicit local-progress import, independently confirmed incremental cross-device sync, safe shared-browser controls, local and remote exports, remote learning-data erasure, sign-out, and account-linked beta-report receipts.

## 3. Explicitly unsupported capabilities

Accounts do not silently import progress. Sync is not enabled merely by signing in or importing. STEM Forge does not provide profiles, avatars, preferences, notifications, social login, billing, premium features, teacher accounts, or automatic account deletion.

## 4. Account-state map

- authentication disabled or misconfigured: account forms are absent and guest learning remains primary;
- signed out: truthful account value, sign-in, sign-up, browser export, and return to learning;
- signed in with owner: verified account identity, import state, canonical learning return, sync choice, secondary data controls, and sign-out;
- signed in with owner resolution unavailable: calm degraded state, learning return, and sign-out;
- expired session: local work remains available and contextual sign-in is offered.

## 5. Guest-progress behaviour

Guest progress remains stored in the current browser. It is not linked to an account until an explicit import or sync association is confirmed. A single dismissible dashboard prompt appears only after meaningful evidence exists, never during a question or practice session, and can reappear only after four further meaningful records.

## 6. Account value proposition

The signed-out surface explains two current benefits: explicitly adding browser progress for account protection and separately enabling supported cross-device updates. It states that guest learning remains available and avoids fear-based loss language.

## 7. Sign-in/sign-up flow

Forms retain native labels, password-manager autocomplete, accurate password guidance, provider-safe result copy, pending-button protection, and focused announced errors. Account creation explains possible email confirmation and explicitly states that it does not import progress.

## 8. Return-destination handling

Account entry, sign-in, sign-up, email callback, recoverable authentication errors, and sign-out preserve a validated internal learning destination. Supported destinations include dashboard, subjects, paths, questions, Practice sessions, resources, and Question Bank routes. Active Practice resume remains higher priority through P3. External, API, internal, account-loop, malformed, control-character, traversal, unbounded, and unsafe nested destinations fail closed.

## 9. Import explanation and consent

Import now answers what is added, what remains, what is not replaced, how duplicates behave, whether learning can continue, and what happens after failure. Confirmation remains explicit and separate from sync.

## 10. Import state model

A pure typed resolver presents checking, unreadable, empty, ready, different-account confirmation, confirmation, importing, success, no-new-progress, partial, failure, and expired-session states. Copy never treats “no new progress” as an error or equates import acknowledgement with complete sync.

## 11. Import execution behaviour

The existing deterministic batching, stable IDs, per-batch acknowledgement, duplicate recognition, conflict retention, local metadata union, and safe retry behavior remain unchanged. A client single-flight guard now prevents duplicate import execution before a rerender. Lost responses remain safely retryable because the server protocol is idempotent.

## 12. Account status presentation

The verified email is shown where available; opaque owner IDs never enter the UI. Import and learning actions precede sync. Export, shared-browser, feedback-history, and destructive controls are grouped under a secondary disclosure instead of competing with learning.

## 13. Authentication-unavailable behaviour

Server-resolved availability remains authoritative. Unavailable account routes do not render broken forms or configuration details. Guest learning and browser export remain available without hydration disagreement.

## 14. Sign-out behaviour

Sign-out remains non-destructive by default, stops in-flight sync safely, and returns to P3’s useful learning destination. Removing current-account browser data remains a separate confirmed action and does not delete remote or other-device progress.

## 15. Account-prompt placement

The global signed-out “Sign in to sync” pill was removed. Account protection is now a single non-blocking dashboard prompt after meaningful guest work. It never competes with the canonical next action, does not appear for signed-in users, and is absent when accounts are unavailable.

## 16. Security and privacy review

Trusted ownership remains server-only. Import envelopes remain owner-free and same-origin. Return URLs use an explicit internal learning-route grammar. No tokens, emails, passwords, owner IDs, connection values, or provider errors enter learning evidence. Password copy no longer falsely claims that the application never transiently receives form input.

## 17. Mobile behaviour

Account value, forms, return action, import confirmation, sync choice, and sign-out retain the established responsive cards and touch targets. Automated 320px form, navigation, and document-geometry checks protect against overflow; 390px import/account flows remain part of real-auth coverage.

## 18. Accessibility behaviour

Forms use programmatic labels and autocomplete. Result errors are alerts, receive focus after navigation, and are associated with relevant inputs. Import panels have headings and polite state announcements. Native disclosures keep secondary controls outside the collapsed focus order. Sign-out removal retains an alert dialog and focus trap.

## 19. Test evidence

Focused coverage includes account/import state derivation, prompt eligibility and recurrence, student vocabulary, safe and unsafe returns, auth error mapping, ownership, import idempotency, batching, conflict retention, sync consent, mobile forms, error focus, guest prompt dismissal, signed-in prompt suppression, hydration, and 320px geometry. Final comprehensive counts are recorded in the completion report.

## 20. Manual-validation evidence

Manual validation covers signed-out value, sign-in/sign-up return context, import confirmation and recovery, account identity, active Practice priority, sign-out return, auth-unavailable behavior, mobile hierarchy, keyboard focus, and console/hydration state. External email delivery, physical devices, and paired assistive technology remain separately bounded.

## 21. Residual limitations

Email delivery and provider verification depend on the configured Supabase project. The verified email may be absent during a transient provider read even when trusted ownership remains available; the UI then truthfully shows a signed-in account without inventing an identifier. Physical-device and screen-reader testing require external hardware.

## 22. Deferred work

No auth provider, schema, ownership, evidence, sync, account deletion, profile, preference, notification, billing, analytics, content, AI, or navigation redesign was added.

## 23. Backend correctness defects

No backend correctness defect was found. The audited import, sync, ownership, and append-only evidence boundaries remain intact. P9 changes presentation, safe routing, and client interaction guards only.
