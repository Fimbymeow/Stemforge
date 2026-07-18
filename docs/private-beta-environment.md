# Private beta environment checks

Required for report persistence:

- `STEMFORGE_DATABASE_URL`

Required when applying database migrations:

- `STEMFORGE_DATABASE_MIGRATION_URL`

The Sprint 21 `stemforge_operations.beta_reports` migration has been applied to the configured development Supabase database. Production reporting persistence is available when the runtime database URL points to a database with the same migration history.

Optional for account-aware ownership:

- `STEMFORGE_AUTH_ENABLED=true`
- existing Supabase server configuration used by authentication

Optional for internal report review:

- `STEMFORGE_INTERNAL_REPORTS_ENABLED=true`
- `STEMFORGE_INTERNAL_REPORT_OWNER_IDS` containing one or more canonical opaque application-owner IDs

Both settings are required in every environment; development has no bypass. Missing or malformed configuration fails closed. The allowlist is server-only and must never be printed, committed or sent to the browser.

Sprint 22 requires migration `1753266400000_beta_report_triage` before the internal dashboard is enabled. The internal real-auth browser test may run only after the dedicated test credential has been rotated or replaced following the Sprint 21 artefact precaution.

Do not expose or commit `.env.local`. Health and readiness endpoints return only status labels and never echo configured values.
