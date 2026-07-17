# STEM Forge Authentication and Trusted Ownership

Updated: 14 July 2026  
Status: Sprint 13 authentication verified; Sprint 14 confirmed import boundary connected

## Provider decision

Supabase Auth manages email/password credentials, verification, recovery and sessions. The application uses the official `@supabase/ssr` cookie integration and `@supabase/supabase-js`; it does not implement passwords, expose a service-role key, or replace the existing `pg` evidence repository with a hosted database SDK.

## Session architecture

Next.js 15 uses `middleware.ts` for `/account/*` and `/auth/*`. It refreshes cookie sessions through a Supabase server client and copies both refreshed cookies and the package-provided private/no-store response headers. Server Components, actions and route handlers create cookie-aware server clients. Authorization never trusts `getSession()` user contents: the identity resolver performs Supabase `auth.getUser()`, which is a fresh provider lookup, and accepts only an email-confirmed user.

## Routes and callbacks

- `/account`: authenticated/unauthenticated owner state and sign-out.
- `/account/sign-up`: email/password registration.
- `/account/sign-in`: verified email/password sign-in.
- `/account/forgot-password`: generic recovery request.
- `/account/update-password`: session-protected password update.
- `/auth/callback`: PKCE code exchange.

The callback accepts only `/account` or `/account/update-password` as onward destinations. Absolute, protocol-relative and all other destinations fall back to `/account`. Invalid or expired codes return a restrained error state.

## Environment and feature control

Accounts appear only when all of the following are set:

```dotenv
STEMFORGE_AUTH_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace-me
STEMFORGE_AUTH_SITE_URL=http://localhost:3000
STEMFORGE_DATABASE_URL=postgresql://restricted-app-role:replace-me@127.0.0.1:5432/stemforge_development
```

The flag is read once in the server `RootLayout`. That trusted boundary passes a serialized availability boolean through a client context; navigation consumes that stable value and never reads `process.env`. Server output and initial client rendering therefore agree in both enabled and disabled modes. Missing or invalid settings keep navigation hidden and make account routes show a safe unavailable page. Normal learner routes and production builds need no auth or database values. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is intentionally public; secret/service-role values must never use `NEXT_PUBLIC_*` and are not required here.

## Provider callback configuration

Configure the Supabase Auth Site URL and Redirect URL allowlist deliberately:

- local: `http://localhost:3000/auth/callback`
- local alternate port: the exact active origin plus `/auth/callback`
- preview: the exact dedicated preview origin plus `/auth/callback`
- production: `https://stemforge.app/auth/callback`

Set `STEMFORGE_AUTH_SITE_URL` to the matching origin for each deployment. Avoid broad production wildcards. Hosted email/password authentication should retain email confirmation. Signup and recovery email delivery also need Supabase's development mail service or a configured production SMTP provider.

## Identity-to-owner schema

`stemforge_identity.application_owners` contains only an opaque database-generated `owner_<uuid>` and database creation time. `stemforge_identity.external_auth_identities` contains provider, immutable provider subject, owner foreign key and database creation time. `(provider, provider_subject)` is the primary key. `owner_id` is deliberately not unique in the mapping table, allowing multiple future provider identities to link to one application owner without changing evidence ownership.

No email or profile is stored. Email can change at Supabase without changing the provider subject or owner. UPDATE, DELETE and TRUNCATE are rejected by database triggers and revoked from `PUBLIC`. Future account erasure must use a separately reviewed, narrowly privileged workflow; append-only or identity protections must not be weakened for ordinary runtime roles.

## Race-safe creation

The PostgreSQL repository opens a transaction and takes a transaction-scoped advisory lock derived from provider and subject. It rechecks the mapping under that lock, returns it when present, or creates exactly one owner and mapping before commit. Concurrent first requests serialize, return the same owner and leave no losing/orphan owner.

## Canonical server-only ownership API

`resolveCurrentAuthenticatedOwner()` is the production entry point. It obtains a verified provider identity, then calls the PostgreSQL mapping repository and returns either a trusted `{ authenticated: true, ownerId, provider }` context or `{ authenticated: false }`. The owner ID is not read from a form, URL, client component, cookie claim or request payload. Provider and PostgreSQL adapters carry `server-only` guards. Future evidence endpoints must call this method and must not accept ownership from the browser.

Authentication/owner resolution is not connected to `PostgresRemoteEvidenceRepository.append()` or `.read()` in Sprint 13.

## Guest and LocalStorage behaviour

Accounts remain optional. `stemforge.localProgress.v1` remains the active canonical V4 learner runtime. Signup, signin, callback, recovery, password update, session expiry and signout do not access, clear, upload or rewrite LocalStorage. No merge, sync, remote progress view or cross-device promise exists. Account screens state those limits explicitly.

## Error, security and privacy boundaries

- Passwords travel directly to Supabase Auth through server actions and are never logged or stored by STEM Forge.
- Tokens and complete connection strings are not logged.
- Cookie behavior follows the SSR package defaults and refreshed responses carry its no-store headers.
- Recovery always gives the same response whether or not an email exists.
- Provider error details are mapped to a small learner-safe result set.
- Expired sessions resolve unauthenticated and do not affect local learning evidence.
- The application database stores no email, name, date of birth, school, address, phone or marketing data.
- Provider identity proves authentication; the opaque application owner controls future evidence ownership.

## Local and test setup

1. Create or select a free/local dedicated Supabase test project; do not use real learner accounts.
2. Enable email/password and email confirmation.
3. Configure the exact Site URL and callback Redirect URLs above.
4. Configure email capture/delivery for signup and recovery.
5. Set the five environment values in the example (including a migrated restricted PostgreSQL application URL).
6. Apply migrations with `pnpm run db:migrate`.
7. Start with PowerShell's call operator: `& "C:\path\to\pnpm.cmd" dev --port 3000`.

The migration CLIs use an `async main()` and caught error boundary so `tsx` can execute them in the repository's CommonJS output mode. They load `.env.local` through the version-matched `@next/env` package, never print connection values, and preserve the isolated-test URL safeguards.

The ordinary Playwright web server explicitly sets `STEMFORGE_AUTH_ENABLED=false` and blanks optional auth/database test variables. This keeps the deterministic regression suite independent of `.env.local`. A separate enabled-rendering configuration supplies only synthetic, non-secret provider settings and proves the Account entry hydrates without console or page errors; it does not contact the real provider. Genuine Supabase verification remains a separate, explicitly configured path.

On Windows a repository runner builds first, starts Next as a direct child, polls readiness, runs Playwright without its shell-based `webServer`, and closes that exact child with bounded cleanup. This avoids Playwright 1.61 waiting indefinitely for a shell-launched process tree to emit `close` after the HTML report has already been written.

Verification commands:

```powershell
pnpm run test:auth
pnpm run test:database
pnpm run test:all
git diff --check
```

Provider-independent tests are not evidence of a real Supabase flow. Full proof requires signup email confirmation, successful signin, refresh persistence, account page, signout and recovery against the configured project, plus confirmation that local progress is byte-for-byte unchanged.

## Known limitations

The configured development PostgreSQL endpoint accepted both committed migrations on 14 July 2026. The configured Supabase Auth endpoint matches the database project and its credential-redacted `/auth/v1/health` request returns HTTP 200. A permitted, auto-confirmed test user completed genuine password signin through the application, reached one trusted application-owner mapping, retained its session after refresh, and signed out successfully. Browser-local progress remained 1/8 before signin, after signin and after signout. The mapped owner had zero remote evidence rows. The recovery route returned the required generic response; mailbox delivery and the email-confirmation link were not inspected. Earlier default-provider probes established its email rate/recipient restrictions without weakening the application boundary. There is no upload, guest merge, sync, remote display, remote reset, deletion, social login, administration or operational monitoring.

## Sprint 14 guest merge contract

Sprint 14 must require explicit learner confirmation; resolve ownership only through the canonical server method; preserve a local backup until durable acknowledgement; union immutable V4 evidence by stable IDs; retain same-ID conflicts; never apply local-wins, remote-wins or replace-all semantics; and leave completion acknowledgement separate. It must remain a separately authorized sprint.

## Sprint 15 sync contract

Sync must remain owner-scoped, append-only, incremental by trusted receive cursor and resilient to retry/offline delivery. It must not infer chronology from client clocks, overwrite accepted evidence, clear unacknowledged local evidence, distribute a destructive reset, or turn snapshots into current readiness truth.

## Sprint 16 shared-device authentication contract

Authentication and synchronization consent remain separate. The same verified account may resume a remembered browser association; a different fingerprint immediately stops scheduled/in-flight transport and must be explicitly confirmed. Sign-out first suspends synchronization and then either keeps browser data or removes only safely attributable current-account browser data. A 401 retains evidence and association metadata in an authentication-required state; same-account reauthentication can resume and different-account reauthentication cannot.

No client identity, fingerprint, answer or evidence payload appears in user-facing diagnostics. Local removal is not remote deletion. See `STEM_FORGE_ACCOUNT_DATA_AND_SHARED_DEVICE_SAFETY.md`.

## Sprint 14 confirmed guest-progress import

Sprint 14 connects trusted owner resolution to remote evidence only through `POST /api/progress/import`. The browser submits a strict protocol-versioned canonical V4 payload and never supplies an authoritative owner. The route requires JSON, a bounded raw body and the configured same origin; it resolves a verified session through `resolveCurrentAuthenticatedOwner()` and appends through the existing repository transaction.

Nothing uploads on sign-in. The authenticated account page reads browser-local evidence only after hydration, shows a neutral summary and requires explicit confirmation. Accepted, identical and conflict-retained records receive per-event durable acknowledgement. Canonical local evidence remains untouched and completion-celebration acknowledgement is never included. A domain-separated owner hash is exposed only as a non-authenticating local account-switch marker; owner ID, email and provider subject remain server-only.

Sprint 14 remains confirmed import. Sprint 15 adds a separate, opt-in synchronization provider and `/api/progress/sync/*` routes. Those routes still resolve only the verified server session and expose only a domain-separated fingerprint; push/pull never accept an owner ID. Distributed reset, deletion and account erasure remain future work. See `STEM_FORGE_INCREMENTAL_PROGRESS_SYNC.md`.

## Official references used

- [Supabase: Creating a server-side client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Supabase: Password-based authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase JavaScript: exchangeCodeForSession](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession)
