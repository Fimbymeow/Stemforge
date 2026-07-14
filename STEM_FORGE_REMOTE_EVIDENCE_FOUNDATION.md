# STEM Forge Remote Evidence Foundation

Updated: 14 July 2026
Status: Sprint 12 PostgreSQL foundation implemented; not connected to learner runtime

## 1. Outcome

STEM Forge now has a server-only asynchronous PostgreSQL repository for canonical V4 evidence owned by an opaque learner identifier. It persists immutable question attempts, support events and structural achievement snapshots as separate rows. LocalStorage remains the only active learner-facing runtime; there is no authentication, public endpoint or sync process.

## 2. Database and query decision

PostgreSQL is the database. `pg` (node-postgres) is the runtime driver because the repository needs a small number of explicit transactional queries and no object-relational mapping. `node-pg-migrate` manages committed forward-only migrations. This keeps database constraints, indexes and append-only triggers directly reviewable.

Drizzle was considered but rejected for this foundation because schema generation would not remove the need for custom PostgreSQL triggers or conflict SQL. Prisma was rejected because its generated client and mutable-model conventions add unnecessary weight. Hosted-provider SDKs were rejected to avoid provider lock-in, owner action and credentials beyond a standard PostgreSQL URL.

`embedded-postgres` is a development-only test harness. It starts native PostgreSQL 17 in a disposable temporary directory so integration tests exercise the real engine without Docker or a hosted service. It is not imported by runtime code.

## 3. Migration policy

Migrations live in `migrations/` and are applied explicitly with `node-pg-migrate`. The application never auto-synchronises schema at startup or build time. The initial migration is forward-only: automatic destructive rollback deliberately throws. A deployment should use a privileged migration connection distinct from the restricted application connection.

## 4. Schema

The `stemforge_remote` schema contains `question_attempts`, `support_events`, `achievement_snapshots`, `evidence_conflicts`, and one shared `evidence_receive_order_seq`.

Each accepted evidence table stores `owner_id`, stable `event_id`, canonical `payload` as JSONB, database-calculated SHA-256 `payload_hash`, global `receive_order`, and database-controlled `received_at`. The conflict table stores kind, owner, event ID, the accepted hash, complete incoming JSONB, its database-calculated hash, conflict identity, receive order and receive time.

## 5. Owner-scoped identity

Evidence identity is `(owner_id, evidence kind/table, event_id)`. The same deterministic migrated event ID can therefore exist for multiple learners without collision. Owner IDs are opaque server inputs rather than emails or authentication-provider IDs. Authentication will later map a verified principal to an opaque owner ID outside this repository.

## 6. Indexes and constraints

Each evidence table has a unique `(owner_id, event_id)` constraint and an `(owner_id, receive_order)` index. Conflicts are unique by owner, kind, event ID, accepted hash and incoming hash, preventing unlimited copies of the same conflict. Checks bound owner/event IDs, evidence kinds, hashes and JSON object shape. A global bigint sequence provides a stable cross-table pull cursor.

## 7. Append-only enforcement

Database `BEFORE UPDATE OR DELETE` and `BEFORE TRUNCATE` triggers raise SQLSTATE `55000` for all four tables. UPDATE, DELETE and TRUNCATE are also revoked from `PUBLIC`. Production should make the migration role the schema owner and grant its runtime role only schema usage, sequence usage, and table INSERT/SELECT. The repository exposes no update, delete or replace-all method.

## 8. V4 validation boundary

The remote boundary accepts canonical V4 only. It reuses the existing attempt, support-event and snapshot guards, then adds strict event-ID, logical-ID, ISO timestamp, exact-key, answer-length, owner-ID, item-count and UTF-8 byte limits. Known versions must remain positive and `unknown_legacy` remains valid. Validation never consults the active content registry, so archived, removed and historically unknown logical IDs survive.

Older payload migration remains solely in the existing local normalization boundary. The remote repository does not accept V1/V2/V3 directly and never invents event IDs, versions or snapshots.

## 9. Repository interface

`PostgresRemoteEvidenceRepository.append(ownerId, unknownBatch)` validates and transactionally classifies a batch into accepted, identical duplicates, same-ID conflicts and rejected invalid records. `read(ownerId, afterCursor?)` reconstructs canonical V4 evidence plus trusted receive metadata. Owner is present in every query. Reads are deterministic by global receive order, kind and event ID.

`createRemoteEvidencePool` reads `STEMFORGE_DATABASE_URL` only when invoked. Both the pool factory and PostgreSQL repository carry Next.js's `server-only` marker. No client component, browser bundle or API route imports them.

## 10. Transaction behaviour

One append batch uses one checked-out `pg` client and one transaction. Each valid record attempts `INSERT ... ON CONFLICT DO NOTHING`. A successful insert is accepted. An existing semantically equal JSONB record is an idempotent duplicate. A different record with the same identity leaves the accepted row untouched and inserts or reuses a conflict row. Thus a batch can commit valid new rows and reported conflicts together; unexpected database failures roll back the transaction.

## 11. Duplicate semantics

Only owner, evidence kind and stable event ID establish possible duplication. JSON key order does not matter: pure code compares deterministic canonical JSON and PostgreSQL stores/computes hashes from JSONB's semantic representation. Identical retries return `duplicates` and do not allocate another evidence row.

## 12. Conflict semantics

A same-ID/different-payload arrival is never an update or merge. The accepted evidence remains unchanged. The incoming canonical payload and both payload hashes are recorded for diagnosis. Repeating exactly the same conflict returns the existing conflict ID rather than creating another row. Repository results expose identities, hashes, trusted times and cursors, not another learner's data or connection information.

## 13. Trusted receive time and cursors

`received_at` defaults to PostgreSQL `clock_timestamp()` and cannot be supplied by the repository insert. Client times remain unchanged inside payload JSON and never replace trusted receive time. All accepted evidence tables share one bigint sequence, so `receive_order` supports later incremental pulls across evidence kinds. Sequence gaps are valid and carry no semantic meaning.

## 14. Environment isolation

- `STEMFORGE_DATABASE_URL`: restricted server runtime connection.
- `STEMFORGE_DATABASE_MIGRATION_URL`: privileged development/production migration connection.
- `STEMFORGE_TEST_DATABASE_URL`: dedicated test connection for explicit external test migration commands.
- `STEMFORGE_ALLOW_REMOTE_TEST_DATABASE=1`: explicit opt-in for a dedicated non-local test database.

Test safety rejects a missing URL, a URL equal to the development runtime URL, a database name without `test`, and a remote host without explicit opt-in. The default integration command instead creates its own temporary native PostgreSQL cluster and database whose name contains `test`.

## 15. Commands

```powershell
pnpm run db:migration:create -- descriptive_name
pnpm run db:migrate
pnpm run db:migrate:test
pnpm run test:remote-evidence
pnpm run test:database
```

`db:migrate` uses `STEMFORGE_DATABASE_MIGRATION_URL`. `db:migrate:test` uses and validates `STEMFORGE_TEST_DATABASE_URL`. `test:database` starts an isolated native PostgreSQL 17 engine, applies the committed migration to a fresh database, runs integration assertions, stops the engine and removes its temporary files.

## 16. Secrets and privacy boundary

No database URL uses a `NEXT_PUBLIC_` prefix, no secret is committed or logged, and `.env.example` contains placeholders only. Evidence payloads contain learning evidence and logical content IDs, not credentials. Authentication, retention, erasure, subject-access logging and privacy policy are not solved by this persistence layer and must be specified before real learner data is accepted remotely.

## 17. Why LocalStorage remains active

The application has no verified learner identity, consent/retention model, network API or sync state machine. Connecting remote storage now would make ownership ambiguous and risk evidence loss. Existing local V4 writes, migrations, reset, mastery, merge and completion acknowledgement remain unchanged. Builds and browser rendering require no database configuration or connection.

## 18. Sprint 13 authentication requirements

Sprint 13 must define verified principal-to-owner mapping, session protection, authorization on every repository call, account lifecycle, privacy/retention requirements, CSRF/request protections and rate/batch controls. It must keep owner IDs opaque and prevent clients from choosing another owner's ID. A public progress route must not exist until those controls are tested.

## 19. Later guest merge and sync rules

Later adoption must union evidence by stable owner-scoped event identity and recalculate projections. It must never apply local-wins, remote-wins or replace-all semantics; overwrite accepted evidence; discard distinct timestamp-similar events; invent legacy versions/snapshots; or clear a local backup before confirmed durable acknowledgement. Same-ID conflicts must remain visible to server diagnostics.

## 20. Known limitations and deferred decisions

There is no authenticated owner provisioning, API, sync, remote reset/deletion/tombstone model, retention job, conflict administration UI, projection cache or operational monitoring. Runtime-role grants are deployment responsibilities because managed PostgreSQL role names differ. Receive order is a persistence cursor, not event chronology. Global erase and distributed reset require a separately designed privacy/deletion event model.

