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
- In production, `STEMFORGE_INTERNAL_REPORT_OWNER_IDS` must include the authenticated application owner ID.
- Without both production settings, ordinary learners and unauthenticated requests receive a sanitized 403.

## Status workflow

Supported status values:

- new
- triaged
- in progress
- resolved
- closed

Allowed transitions are intentionally conservative: new reports can be triaged or closed, triaged reports can move in progress or closed, in-progress reports can be resolved or closed, resolved reports can be closed or reopened in progress, and closed reports are final.

## Health checks

- `/api/health` returns a public, credential-free liveness response.
- `/api/health/ready` returns sanitized readiness for app, auth configuration and database availability.

Readiness responses never include environment values or credentials.

## Triage guidance

1. Search by report ID first.
2. Confirm category, content reference and page area.
3. Reproduce using the content IDs and route, not learner answers.
4. Move the report through the status workflow with a short resolution summary.
5. If follow-up is needed, use the optional contact email only for that report.

Sprint 21 does not send email notifications and does not create a support-thread or messaging system. Report references and the internal status workflow are the complete operational boundary for this stage.

## Rate limits

Submissions are rate-limited by authenticated owner ID when available, otherwise by the opaque guest report session ID. Current limits are five reports per hour and twenty reports per day.
