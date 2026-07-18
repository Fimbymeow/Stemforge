# STEM Forge internal beta operations and triage

## Purpose

Sprint 22 provides a narrow workspace for trusted operators to review explicit private-beta reports. It is not an admin portal, CRM, analytics product, learner-progress explorer or support conversation system.

Internal pages:

- `/internal/beta-reports` — bounded queue, report-only summary and sanitized readiness
- `/internal/beta-reports/[reportId]` — safe submission context and workflow controls

Internal APIs:

- `GET /api/internal/beta-reports`
- `GET/PATCH /api/internal/beta-reports/[reportId]`
- `GET /api/internal/health`

These routes are absent from learner navigation, are no-store/noindex, and authorize independently on every request.

## Authorization

Internal access is server-side and fail closed. All conditions are required:

1. `STEMFORGE_INTERNAL_REPORTS_ENABLED=true`
2. account authentication is correctly enabled
3. the request has a verified Supabase session
4. the session resolves to an immutable application owner
5. that exact opaque owner is present in `STEMFORGE_INTERNAL_REPORT_OWNER_IDS`

The allowlist is server-only and accepts only canonical opaque owner IDs. An empty, malformed or partial allowlist is misconfigured. Development has no bypass. Email, browser fingerprints, hidden routes and client-submitted owner IDs never confer access.

Do not commit or print the allowlist. Determine and configure a trusted owner through controlled database/operator setup outside learner-facing code.

## Operational fields

Severity is distinct from the learner-selected report kind:

- `low` — suggestion, wording or cosmetic issue
- `normal` — ordinary bug, feedback or support request
- `high` — important workflow blocked or multiple learners affected
- `critical` — security, integrity, data-loss or widespread outage concern

Severity defaults to `normal`; learners cannot set or view it. There is no automatic or AI classification.

Reproduction status:

- `not_checked`
- `unable_to_reproduce`
- `reproduced`
- `needs_more_information`

Assignment is deliberately deferred. Current authorization identifies the acting operator for a narrow audit record without creating staff accounts or exposing operator identity to learners.

## Status workflow

Supported states remain `new`, `triaged`, `in_progress`, `resolved` and `closed`.

Allowed transitions:

- new → triaged or closed
- triaged → in progress, resolved or closed
- in progress → triaged or resolved
- resolved → closed or in progress
- closed → triaged

Resolving requires a concise resolution summary. Closing requires either an explanation or a valid duplicate target. Reopening clears the active resolved timestamp but preserves the summary for operator review. The summary remains bounded to 2,000 characters.

Every workflow update requires the report's current `state_version`. A stale update returns a conflict and the operator must refresh. The audit table stores only status, severity, reproduction, duplicate reference, summary-presence flag, version, actor owner and timestamp. It never copies learner messages or diagnostics.

## Duplicate handling

One report may point to one primary report through `duplicate_of`.

- the target must exist
- self-reference is rejected by service and database constraint
- cycles are rejected inside the update transaction
- relationships may be removed
- no automatic similarity detection or clustering exists
- no report deletion is available

Learners may see that their authenticated report was closed as a duplicate but never receive another learner's reference.

## Search, filters and pagination

The queue defaults to `status=new`, newest first and 25 rows. Page size is limited to 100. Supported filters are status, kind, severity, reproduction state, authenticated/guest source, page area and created-date bounds.

Search accepts 3–80 characters and supports:

- exact public report reference
- bounded message text search
- safe question/content ID
- safe public error code

Sort choices are newest, oldest, severity and recently updated. SQL is parameterized, sort expressions are server-selected, and the opaque cursor is validated and tied to its sort. List rows do not select contact email, diagnostics, guest IDs or owner IDs.

Operational summary counts come only from explicit reports. Most use a 30-day window; recent resolution uses seven days. There is no learner activity, progress, answer or passive analytics input.

## Safe detail data

The detail page renders learner text as plain React text with no Markdown or HTML execution. Diagnostics are displayed through explicit allowlisted labels. Contact email, when present, is labelled user-provided and is not included in list views or logs.

Never ask a learner for passwords, tokens, cookies, storage dumps or answers. Use safe content IDs and coarse device/auth/sync state to reproduce problems.

Authenticated learners see only their own reference, kind, dates, public status and safe resolved/closed outcome on the account page. They do not see severity, reproduction, duplicates belonging to others, audit entries, operator identity, internal health or diagnostics. Guest receipts remain local-only and there is no public report lookup.

## Health summary

The internal health strip reports sanitized states for application, database, auth configuration, reporting tables, triage migration and internal-review configuration. It includes no host, project reference, credential, row contents or learner counts. Refresh is manual; this is not an infrastructure monitoring platform.

Public `/api/health` remains minimal and `/api/health/ready` remains sanitized.

## Category guidance

- Content: verify exact question/version; fix future versioned content, never historical evidence.
- Sync/account: use safe sync and account-generation state; direct learners to existing export/reconciliation controls; never request credentials.
- Graph/nature table: reproduce with supplied expression configuration, viewport and question version.
- Practice: verify practice mode, sparse-content behavior and local session behavior.
- Security: mark critical, avoid public discussion, preserve minimum information, disable unsafe functionality through deployment controls if necessary, rotate affected credentials, and escalate outside ordinary triage.

## Testing and credential precaution

`pnpm run test:e2e:internal:real` uses a dedicated Supabase test user and a disposable embedded PostgreSQL database. It creates a temporary application owner/allowlist and synthetic reports. Its Playwright configuration disables screenshots, traces and video so filled test fields are not retained.

Before running any real-auth verification, rotate the dedicated credential that appeared briefly in a removed Sprint 21 failure artifact, or replace it with a new disposable dedicated test user. Never use a learner account.

The two synthetic Sprint 21 live verification reports may remain. Destructive workflow tests must use the disposable database; do not mutate real learner reports.

## Explicit exclusions

No report deletion UI, user impersonation, account administration, progress/answer browsing, broad export, passive analytics, CRM, threaded notes, chat, email/SMS, AI triage, automated duplicate detection, issue-tracker integration, payments, teacher tools, remote configuration or monitoring platform is included.

## Sprint 23 recommendation

Start Sprint 23 only from the verified Sprint 22 commit and an explicit brief. Prefer evidence from private-beta operations before expanding support automation or administration scope.
