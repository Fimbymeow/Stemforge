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
- `STEMFORGE_INTERNAL_REPORT_OWNER_IDS` in production

Do not expose or commit `.env.local`. Health and readiness endpoints return only status labels and never echo configured values.
