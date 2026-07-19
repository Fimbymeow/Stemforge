# STEM Forge platform hardening

## Scope and evidence

Sprint 23 is a focused hardening pass over the Sprint 22 product. It does not change the evidence model, authentication provider, sync protocol, routes, curriculum, or learner flows. Measurements are local Windows development evidence and will vary by machine; they are regression signals, not production service-level objectives. This work is neither a formal penetration test nor formal WCAG certification. No passive analytics or production deployment was added.

## Measured baseline and bundle review

The clean `c00b5ff` baseline production build completed in 79.8 seconds (24.0-second cold compilation) and generated 35 static pages. Shared first-load JavaScript was 102 kB. Representative first-load totals were: landing 120 kB, dashboard 149 kB, question/graph routes 272–276 kB, and internal queue/detail 106–108 kB. Post-change production builds retain 102 kB shared JavaScript; landing remains 120 kB, dashboard 150 kB, graph/question 273 kB, practice session 277 kB, and internal queue/detail 106–108 kB. The 1 kB rounded increases are the shared recovery/reporting hardening and remain inside the documented bundle tolerance.

Graph/maths code remains isolated from landing, dashboard, account, and internal operations bundles. Internal repository and authorization code remains server-only and does not enter learner bundles. No speculative dynamic-import split was made because measured output did not show an unrelated heavy-module leak.

## Performance changes

`createContentResolver` now builds immutable active-question, version, route, and path indexes once per source. Question and path lookup are expected O(1); the first full path index build is O(subjects + courses + paths), path question materialization is O(questions in the path) once, and cached question context lookup is O(1). Practice reference resolution reuses the canonical resolver rather than rebuilding registries. A synthetic test constructs 10,000 questions, performs 100,000 indexed lookups under a broad five-second ceiling, and verifies graph sampling remains capped at 601 points even when one million samples are requested.

The timed practice display is isolated in `PracticeTimer`, so a one-second clock tick no longer updates the full question workspace. Expiry still reaches the parent exactly once. Graph sampling was already memoized and bounded; the audit preserved that implementation.

PostgreSQL review found parameterized statements, bounded evidence pages, stable cursors, bounded learner/internal report pages, projected list columns, and indexes matching owner, guest, status, update, severity, reproduction, and page-area query paths. The disposable database suite now inserts 10,000 synthetic reports and requires a 50-row filtered queue page under a broad two-second ceiling. No speculative migration or index was justified.

## Accessibility

The root layout now exposes a visible-on-focus “Skip to main content” link and a focusable main landmark. The feedback dialog has a programmatic name and description, initial focus, Escape close, Tab/Shift+Tab containment, and deterministic focus return to its trigger. Failure is announced as an alert and success as status. Practice timer announcements are restrained with `aria-live="off"` so screen readers are not interrupted every second.

The critical browser test verifies skip-link operation, dialog focus entry/return, headings, labelled controls, guest question operation, SVG graph visibility, and no unexpected page errors. Chromium and Firefox exercise the skip link from the keyboard. WebKit/Safari does not make links Tab stops unless full keyboard access is enabled, so its test explicitly focuses and activates the link while the other engines provide keyboard proof. Existing suites cover mobile reflow, graph keyboard alternatives, nature tables, practice, account flows, and internal controls. This is an engineering audit against WCAG 2.2 AA principles, not certification; manual assistive-technology testing remains recommended.

## Security and privacy boundaries

All app responses receive a restrictive CSP plus `frame-ancestors 'none'`, `object-src 'none'`, same-origin form/base/script policy, scoped Supabase connection sources, MIME sniffing protection, strict referrer and permissions policies, frame denial, opener/resource isolation, and origin-agent clustering. Production adds HSTS and excludes `unsafe-eval`; development retains `unsafe-eval` for the Next development runtime. Next currently requires inline scripts/styles, so CSP retains `'unsafe-inline'` for those directives. `upgrade-insecure-requests` is deliberately omitted because it breaks an HTTP local production-server verification path in Firefox/WebKit; deployment HTTPS is enforced through the public URL readiness check and HSTS.

Account export, reauthentication, erasure confirmation, and cancellation bodies use a shared 4 KiB UTF-8 JSON boundary that rejects invalid length, oversize, unreadable, malformed, array, and primitive inputs before schema parsing. Existing import, sync, and reporting body limits, same-origin checks, server-side ownership, parameterized SQL, sanitized errors, private no-store responses, and server-side report rate limits remain intact. No client owner identifier, raw database error, secret, report body, answer, token, cookie, allowlist, or environment value is logged. React text rendering remains the boundary for report and internal-operation content; formula evaluation contains no `eval` or `new Function`.

## Reliability, recovery, and storage

Route-level recovery boundaries now isolate dashboard, question, practice, account, and internal-report failures. `RouteError` exposes a stable public-safe code, a retry action, and a safe navigation action without a stack trace or sensitive state.

Local learning remains independent of the network. Practice and report-receipt storage now treats unavailable or quota-exceeded storage as a recoverable false/unavailable result. Practice history remains bounded by `MAX_PRACTICE_HISTORY`; report receipts remain bounded by `MAX_REPORT_RECEIPTS`. Canonical progress evidence is not pruned by this work.

Progress synchronization retains exponential jittered backoff from 5 seconds to a 15-minute ceiling. HTTP 429 now respects numeric or HTTP-date `Retry-After`, bounded to 1 second–15 minutes and never shorter than local backoff. Offline state aborts the active request and schedules no tight loop; authentication, account-generation, erasure, cancellation, idempotency, and evidence-preservation behavior stays unchanged.

## Browser and deployment readiness

`test:e2e:hardening` runs one no-retry critical journey in Chromium, Firefox, and WebKit using a credential-free auth-disabled production server. Ordinary Playwright remains deterministically auth-disabled. Real Supabase flows remain separate and explicitly configured.

`pnpm run verify:deployment` is a non-mutating, value-redacted readiness check. Local dry-run mode allows optional database/auth configuration; production validation requires a valid HTTPS public URL, named server-only application and migration database connections, coherent authentication/internal-operations configuration, no forbidden sensitive `NEXT_PUBLIC_*` names, and the current migration contract (`1753266400000`). It never prints configured values. It does not deploy or mutate a database.

## Dependency review

The initial production audit found one moderate PostCSS advisory (GHSA-qx2v-qp2m-jg93) through Next. A pnpm workspace override and direct development pin now select PostCSS 8.5.10. The repeated production audit reports no known vulnerabilities. That result is limited to registry advisory data and the resolved graph at audit time; it is not a guarantee that no undisclosed vulnerability exists. No major framework upgrade was performed.

## Remaining risk and next work

- Revisit CSP inline-script/style allowances when the deployed Next version supports a practical nonce/hash strategy for this app.
- The Supabase client dependency still produces the known Next Edge-runtime Node API build warning; tested auth behavior is unchanged, but a future compatible dependency/framework upgrade should remove it.
- Performance and accessibility evidence is local and representative, not real-user monitoring or a formal lab/certification.
- Graph/question/practice bundles are intentionally larger because they contain interactive maths tooling; profile real devices before further splitting.
- The readiness script validates configuration shape and migration contract without mutating production. External deployment health and infrastructure monitoring remain operational responsibilities.

The recommended Sprint 24 starting point is curriculum/content expansion only after reviewing these residual CSP and Edge-runtime upgrade items; do not reopen the evidence, authentication, or sync architecture without a verified defect.
