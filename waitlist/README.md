# Orthic pre-launch waitlist

This is the complete public deployment boundary for `orthic.co.uk`. It is a Cloudflare Worker with Static Assets, a controlled `/api/waitlist` endpoint, a D1 database binding and a Workers Rate Limiting binding. It contains no learner application code or routes.

## Public routes

- `/` — waitlist page
- `/privacy/` — waitlist privacy notice
- `/api/waitlist` — POST-only form endpoint
- `/assets/*`, `/styles.css`, `/waitlist.js`, `/robots.txt` — required static assets

All other paths return `404`. In particular, `/dashboard`, `/subjects`, `/practice`, `/account`, authentication and internal application routes are not part of this project.

## Local verification

From the repository root:

1. `pnpm install`
2. `pnpm --dir waitlist run db:migrate:local`
3. `pnpm --dir waitlist run dev`
4. Open `http://127.0.0.1:8787`

Local builds intentionally emit `noindex, nofollow` and no production canonical:

- `pnpm --dir waitlist run build`

A production build requires a monitored public privacy address:

- PowerShell: `$env:ORTHIC_PRIVACY_CONTACT_EMAIL='privacy@orthic.co.uk'; pnpm --dir waitlist run build:production`

The address is public build-time configuration, not a secret. It is rendered into the Privacy page so deletion requests have a real destination.

## Cloudflare setup (do not run until the local diff is approved)

Deployment target: **Cloudflare Workers with Static Assets**, not the full Next.js application and not a Pages project that points at the repository root.

1. Create a D1 database in the EU jurisdiction or another reviewed location:
   - `pnpm --dir waitlist exec wrangler d1 create orthic-waitlist --jurisdiction eu`
2. Replace the placeholder `database_id` in `waitlist/wrangler.jsonc` with the returned D1 UUID.
3. Apply the checked-in migration:
   - `pnpm --dir waitlist run db:migrate:remote`
4. Configure `ORTHIC_PRIVACY_CONTACT_EMAIL` as a build environment variable with a monitored address.
5. Build and deploy from the repository using the `waitlist` project only:
   - build command: `pnpm run build:production`
   - deploy command: `pnpm exec wrangler deploy`
   - project root directory: `waitlist`
   - static asset output directory: `waitlist/dist` from the repository root, or `dist` from the project root
   - runtime: Cloudflare Workers, compatibility date `2026-08-31`
6. Attach `orthic.co.uk` as the Worker custom domain only after preview verification. Do not route the domain to the Vercel project.

No browser-visible or server secret is required. D1 and Rate Limiting are capability bindings configured in `wrangler.jsonc`; their credentials are not environment variables. The Rate Limiting namespace ID must remain unique within the Cloudflare account.

The production build emits the canonical `https://orthic.co.uk/` and allows indexing. Worker preview URLs receive `X-Robots-Tag: noindex` through `_headers`.

## Data and abuse controls

D1 stores only:

- normalized email address;
- creation timestamp;
- fixed source value `website`.

The endpoint enforces JSON-only POST requests, same-origin browser submissions, a 512-byte body limit, exact payload keys, server-side normalization and validation, an invisible honeypot, duplicate suppression and a five-attempts-per-minute rate limit keyed by a SHA-256 digest of the normalized email. It does not retain IP addresses or user-agent strings.
