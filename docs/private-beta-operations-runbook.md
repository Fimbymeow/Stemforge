# STEM Forge private beta operations runbook

## Feedback and support intake

Learners can submit beta reports from the in-app feedback control. Reports are explicit, user-initiated submissions only; STEM Forge does not add passive analytics or background tracking.

The Sprint 21 reporting migration is applied in the configured development Supabase environment, so server-side report persistence is available there. Apply the repository migration history to each later deployment environment before enabling reporting traffic.

Report categories:

- bug
- feedback
- support request
- content issue
- account issue

Each accepted report receives a stable `SF-XXXXXXXXXX` reference. The browser may store recent references for learner receipts, but it does not store report message text.

## Diagnostic allowlist

The client and server only accept a small diagnostics allowlist:

- app version and short build commit
- environment label
- route, page area, viewport category and online state
- coarse auth/sync/account generation state
- browser name/version, operating system, locale and timezone
- safe content references such as question ID, question version, content revision and question type
- safe error code, practice mode and component name

Excluded from diagnostics:

- passwords, cookies, access tokens or session tokens
- learner answers
- full local-progress payloads
- localStorage/sessionStorage dumps
- arbitrary URL query strings from other origins
- Supabase URLs, keys or database connection strings

## Internal review access

Internal report review fails closed by default.

- `STEMFORGE_INTERNAL_REPORTS_ENABLED=true` must be set before review APIs respond.
- `STEMFORGE_INTERNAL_REPORT_OWNER_IDS` must include the verified authenticated application owner ID in every environment.
- Missing, empty or malformed configuration fails closed. Ordinary learners and unauthenticated requests receive a sanitized denial.
- Internal pages are not linked from learner navigation and are protected server-side on every request.

## Status workflow

Supported status values:

- new
- triaged
- in progress
- resolved
- closed

Allowed transitions are intentionally conservative: new reports can be triaged or closed; triaged reports can move in progress, resolved or closed; in-progress reports can return to triage or resolve; resolved reports can close or reopen in progress; and closed reports can reopen to triage. Resolution requires a summary. Closure requires an explanation or a valid duplicate.

Severity (`low`, `normal`, `high`, `critical`) and reproduction state are internal-only. Duplicate targets must exist and cannot form self-links or cycles. Every update uses an expected state version so concurrent changes fail rather than overwrite silently.

## Health checks

- `/api/health` returns a public, credential-free liveness response.
- `/api/health/ready` returns sanitized readiness for app, auth configuration and database availability.

Readiness responses never include environment values or credentials.

The protected dashboard also shows sanitized reporting-table, triage-migration and internal-review configuration states. It refreshes manually and is not an infrastructure monitoring system.

## Triage guidance

1. Search by report ID first.
2. Confirm category, content reference and page area.
3. Reproduce using the content IDs and route, not learner answers.
4. Move the report through the status workflow with a short resolution summary.
5. If follow-up is needed, use the optional contact email only for that report.

The list is cursor-paginated and server-filtered. It never selects raw owner IDs, contact email or full diagnostics. The detail view renders message text without HTML/Markdown execution and labels every allowed diagnostic field.

Sprint 21 does not send email notifications and does not create a support-thread or messaging system. Report references and the internal status workflow are the complete operational boundary for this stage.

See `STEM_FORGE_INTERNAL_BETA_OPERATIONS_AND_TRIAGE.md` for Sprint 22 authorization, workflow, duplicate, concurrency, learner-visibility and testing rules.

## Rate limits

Submissions are rate-limited by authenticated owner ID when available, otherwise by the opaque guest report session ID. Current limits are five reports per hour and twenty reports per day.
