# STEM Forge production deployment and release verification

## Release status

Vercel is the existing provider and `main` is the production branch. The stable public alias is `https://stemforge-6an8.vercel.app`. HEAD `526a378f136b76f60684d3204f11f5effea4f019` deployed successfully and serves STEM Forge guest routes over HTTPS with the expected security headers; `GET /api/health` confirms `buildCommit` matches this HEAD.

**Production readiness is now confirmed live.** `GET /api/health/ready` returns `{"status":"ready","checks":{"application":"ok","configuration":"ok","authentication":"ok","database":"ok","migration":"ok","reporting":"ok"}}`. Root cause of the prior block: `STEMFORGE_DATABASE_URL` held stale/incorrect Supabase Transaction Pooler credentials; it was replaced with the current pooler URL and production was redeployed. The non-destructive `pnpm run test:production:smoke` suite has passed against the production origin. `https://stemforge.app` still belongs to a different application and must not be treated as canonical. Two other Git-linked Vercel projects named `stemforge` and `tuition` also receive deployments but have unrelated public aliases; review and disconnect them manually if obsolete.

Not yet separately confirmed: the credentialed authenticated smoke pass described below (real sign-in, refresh, owner mapping, account, one synthetic attempt, sync, one synthetic report, ordinary-user internal denial, authorised internal access). Run and record that pass before relying on the authenticated/account journey for anything beyond the readiness-gate evidence above.

## Provider and runtime contract

- Provider: existing Vercel GitHub integration; production branch `main`.
- Framework: Next.js 15 with server routes and middleware.
- Runtime: Node.js 22.x; package manager pnpm 11.9.0.
- Install: `pnpm install --frozen-lockfile`; build: `pnpm run build`.
- Preview deployments use isolated URLs and must not silently become the Supabase production Site URL.
- Stable production origin: `https://stemforge-6an8.vercel.app` until an owned custom domain is configured.
- Vercel environment scopes must be reviewed separately. Tokens, private provider IDs and `.vercel` state never belong in Git.

`vercel.json`, `package.json`, `next.config.ts` and `middleware.ts` define the source-controlled provider/runtime boundary. Vercel supplies `VERCEL_ENV` and `VERCEL_GIT_COMMIT_SHA` server-side.

## Environment contract

Browser-safe production values:

- `NEXT_PUBLIC_SITE_URL`: exact path-free HTTPS canonical origin.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase HTTPS Project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon browser key only.

Server-only production runtime values:

- `STEMFORGE_DATABASE_URL`: restricted pooled/serverless application connection with SSL.
- `STEMFORGE_DATABASE_CA_CERT`: official Supabase CA certificate, stored server-only; multiline PEM and escaped newlines are supported.
- `STEMFORGE_AUTH_ENABLED=true`.
- `STEMFORGE_GOOGLE_AUTH_ENABLED=true` for the public-beta launch.
- `STEMFORGE_AUTH_SITE_URL`: exactly equals `NEXT_PUBLIC_SITE_URL`.
- `STEMFORGE_AUTH_ALLOWED_REDIRECT_URLS`: exact HTTPS callbacks; production requires the canonical `/auth/callback` and rejects wildcards.
- `STEMFORGE_INTERNAL_REPORTS_ENABLED`: normally `false` until deliberately enabled.
- `STEMFORGE_INTERNAL_REPORT_OWNER_IDS`: opaque owner allowlist, only when internal reports are enabled.
- `STEMFORGE_BUILD_COMMIT`: optional non-Vercel build-identity fallback.

Migration-only operator value: `STEMFORGE_DATABASE_MIGRATION_URL`, using a direct or transaction-pooler SSL connection with DDL privileges. It is not required in hosted runtime.

Test-only operator values: `STEMFORGE_TEST_DATABASE_URL`, `STEMFORGE_ALLOW_REMOTE_TEST_DATABASE`, dedicated auth/internal test credentials, `STEMFORGE_PRODUCTION_BASE_URL`, and `STEMFORGE_PRODUCTION_EXPECT_READY`. Never configure test credentials in Vercel production. Production never depends on `.env.local`; `.env.example` has names and placeholders only.

## Canonical origin and Supabase authentication

Set `NEXT_PUBLIC_SITE_URL` and `STEMFORGE_AUTH_SITE_URL` to `https://stemforge-6an8.vercel.app`. Configure that exact Supabase Site URL and the exact application callback destination:

- `https://stemforge-6an8.vercel.app/auth/callback`

Enable Google in Supabase Authentication Providers. In Google Cloud, register the authorised redirect URI supplied by Supabase: the project HTTPS origin followed by `/auth/v1/callback`. The STEM Forge `/auth/callback` belongs in Supabase's redirect allowlist, not Google's provider callback list. Confirm both dashboards manually because source-controlled verification cannot prove external provider state.

Do not allow wildcard preview origins in production. Use a separate preview auth project/configuration or keep preview auth disabled. `safeAuthRedirect` accepts only `/account` and `/account/update-password`; external, protocol-relative, encoded and malformed destinations fall back to `/account`. Session cookies remain managed by `@supabase/ssr`; middleware refresh is limited to account/auth routes. Internal access additionally requires a verified opaque application owner in the server-only allowlist.

## Production database and migrations

The production/private-beta Supabase project was not confirmed in this session. An owner must confirm the project reference before any migration; never infer production from the development `.env.local`. Runtime uses a restricted pooled role, migration tooling uses the separate migration connection, and both must verify SSL.

Run from a trusted operator terminal, in order:

```text
pnpm run verify:deployment:migration
pnpm run db:migrate:status
pnpm run db:migrate
pnpm run db:migrate:status
```

Expected forward-only chain:

1. `1752499000000_remote-evidence-foundation`
2. `1752585400000_authentication_owners`
3. `1752670800000_guest-progress-owner-integrity`
4. `1752840000000_account-data-export-erasure`
5. `1753180000000_beta_reports`
6. `1753266400000_beta_report_triage`
7. `1753352800000_guided-self-assessment-evidence`
8. `1753439200000_review-evidence`
9. `1753525600000_flashcard-review-evidence`

Never reset schemas, edit production tables manually, or reverse a forward-only migration destructively. Client/Public privileges remain revoked by the committed migrations; internal tables remain server-only.

## Build and verification

```text
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run validate-content
pnpm test
pnpm run test:database
pnpm run test:e2e
pnpm run build
pnpm run verify:deployment
pnpm run verify:deployment:production
pnpm run db:migrate:status
```

Non-destructive production smoke:

```text
STEMFORGE_PRODUCTION_BASE_URL=https://stemforge-6an8.vercel.app
STEMFORGE_PRODUCTION_EXPECT_READY=true
pnpm run test:production:smoke
```

The smoke suite runs Chromium, Firefox and WebKit and covers landing, dashboard, path, question, graph, practice, feedback dialog without submission, account rendering, malformed callback safety, internal denial, health/readiness, headers, assets and browser errors. It submits no answer, report or account mutation.

Credentialed production verification must use a dedicated team identity. Verify sign-in, refresh, owner mapping, account, one clearly synthetic attempt, sync, one `Sprint 24 production smoke test` report, learner-safe status and ordinary-user internal denial. Verify authorised internal access only with a dedicated allowlisted operator. Never browse real learner/report rows or erase accounts; record any synthetic rows left behind.

Credentialed production smoke mechanism:

```text
STEMFORGE_PRODUCTION_BASE_URL=https://stemforge-6an8.vercel.app
STEMFORGE_PRODUCTION_AUTH_TEST_EMAIL=<dedicated disposable account>
STEMFORGE_PRODUCTION_AUTH_TEST_PASSWORD=<dedicated disposable password>
STEMFORGE_PRODUCTION_AUTH_CONFIRM_DISPOSABLE=YES
pnpm run test:production:smoke:authenticated
```

The explicit disposable-account confirmation is required before the browser starts. The test uses a stable synthetic attempt identifier, proves that sign-in does not auto-import, explicitly imports, performs a sync read/write cycle, confirms a stable owner fingerprint, signs out and confirms the session is gone. It never deletes an authentication identity or reads another learner's rows. Synthetic evidence may remain on the dedicated account; erase its learning data through the normal account control only as a deliberate operator cleanup step.

## Health, CSP and runtime

`/api/health` is minimal liveness and exposes only release name and truncated commit. `/api/health/ready` is no-store and reports bounded configuration, authentication, database/SSL, migration and reporting categories. In Vercel production it returns 503 until every required production category is `ok`; guest local learning can remain usable during a configuration block.

When the runtime uses the Supabase Transaction Pooler (Supavisor), `pg_stat_ssl` is not a reliable signal for the client connection: a query through the pooler observes Supavisor's borrowed upstream PostgreSQL session, not the Vercel-to-Supavisor TLS socket. Production readiness therefore validates the server-only CA configuration and performs an actual query using the verified node-postgres TLS client; successful connectivity under that enforced configuration marks the database category `ok`.

Production CSP excludes `unsafe-eval`; inline scripts/styles remain the documented Next.js compromise. Verify deployed console output after every release. Middleware imports no Node database code; database health runs in a Node server route. Internal routes remain no-store and conceal allowlists.

## Rollback runbook

1. Record the failing commit, deployment and sanitized health state.
2. Promote the last known good Vercel deployment or revert the application commit normally.
3. Restore the prior Vercel production environment snapshot; never copy preview/test credentials.
4. Set `STEMFORGE_INTERNAL_REPORTS_ENABLED=false` if internal authorization is uncertain.
5. Pause beta invitations through the existing manual process and publish a minimal degraded notice if available.
6. Verify liveness, readiness, landing, authentication and database connectivity.
7. Treat migrations as forward-only: use an application version compatible with the current schema or add a corrective forward migration, never a destructive rollback.
8. Confirm guest local progress remains intact and rerun production smoke.

## Reusable release checklist

- [ ] Clean aligned `main`, expected commit, no generated artefacts or secrets.
- [ ] Frozen install, complete tests, database tests and production build pass.
- [ ] Vercel `stemforge-6an8`, `main`, Node 22.x and pnpm 11.9.0 confirmed.
- [ ] Correct environment scopes; test/migration credentials absent from runtime.
- [ ] Canonical HTTPS origin and exact Supabase Site/redirect URLs confirmed.
- [ ] Production Supabase project, SSL, restricted runtime role and migration role confirmed.
- [ ] Migration status current through `1753525600000_flashcard-review-evidence`.
- [ ] Google enabled in Supabase; Supabase `/auth/v1/callback` registered in Google; exact canonical app callback registered in Supabase; no production wildcard.
- [x] Liveness 200; readiness 200 with every bounded category `ok`. Confirmed live against `https://stemforge-6an8.vercel.app` during Programme 6 Phase 1 and independently reconfirmed since.
- [x] Chromium, Firefox and WebKit production smoke pass without CSP/asset/browser errors. `pnpm run test:production:smoke` reported passing against the production origin.
- [ ] Dedicated authenticated smoke and ordinary-user internal denial pass. **Still outstanding** — distinct from the non-destructive smoke above; run before relying on the authenticated/account journey for Alpha.
- [ ] Authorised internal access verified only when intentionally enabled.
- [ ] Logs checked safely; rollback target and environment snapshot recorded.

## Manual actions remaining

1. ~~Sign in to the Vercel team owning `stemforge-6an8` and configure production values.~~ Done — `STEMFORGE_DATABASE_URL` corrected to the current Supabase Transaction Pooler connection string.
2. ~~Confirm the correct production/private-beta Supabase project and connections.~~ Done — confirmed reachable; `database`, `migration` and `reporting` all report `ok`.
3. Configure exact Supabase Site URL and redirect URLs. *(Not independently re-verified this pass; `authentication: "ok"` in the readiness response certifies configuration shape only, not the exact redirect-URL allowlist.)*
4. ~~Check migration status, apply only confirmed pending migrations, and check again.~~ Done — readiness reports `migration: "ok"`.
5. ~~Redeploy and require `/api/health/ready` to return 200.~~ Done — confirmed live during Programme 6 Phase 1 and independently reconfirmed since.
6. Run three-browser production smoke — done (`pnpm run test:production:smoke` passed). **Dedicated authenticated production smoke is still outstanding.**
7. Review and disconnect the duplicate `stemforge` and `tuition` Vercel Git projects if obsolete. *(Not verified this pass.)*

Production readiness and non-destructive smoke are genuinely green as of HEAD `526a378f136b76f60684d3204f11f5effea4f019`. The remaining gate before relying on the authenticated/account journey for Alpha is item 6's credentialed pass and item 3's redirect-URL confirmation.
