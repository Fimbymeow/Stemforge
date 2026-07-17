exports.up = (pgm) => {
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS stemforge_account_data;

    CREATE TABLE stemforge_account_data.account_state (
      owner_id text PRIMARY KEY REFERENCES stemforge_identity.application_owners(owner_id),
      generation bigint NOT NULL DEFAULT 1 CHECK (generation >= 1),
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'erasure_pending', 'processing', 'closed')),
      state_version bigint NOT NULL DEFAULT 1 CHECK (state_version >= 1),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      last_erased_at timestamptz
    );

    INSERT INTO stemforge_account_data.account_state (owner_id)
      SELECT owner_id FROM stemforge_identity.application_owners
      ON CONFLICT (owner_id) DO NOTHING;

    CREATE FUNCTION stemforge_account_data.create_owner_state()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      INSERT INTO stemforge_account_data.account_state (owner_id) VALUES (NEW.owner_id)
      ON CONFLICT (owner_id) DO NOTHING;
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER application_owner_create_account_state
      AFTER INSERT ON stemforge_identity.application_owners
      FOR EACH ROW EXECUTE FUNCTION stemforge_account_data.create_owner_state();

    CREATE TABLE stemforge_account_data.requests (
      request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      request_type text NOT NULL DEFAULT 'learning_progress_erasure'
        CHECK (request_type = 'learning_progress_erasure'),
      status text NOT NULL CHECK (status IN (
        'awaiting_reauthentication', 'awaiting_confirmation', 'scheduled', 'processing',
        'completed', 'failed_retryable', 'cancelled'
      )),
      generation_before bigint NOT NULL CHECK (generation_before >= 1),
      generation_after bigint CHECK (generation_after IS NULL OR generation_after > generation_before),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      reauthenticated_at timestamptz,
      confirmed_at timestamptz,
      cancellation_deadline timestamptz,
      irreversible_at timestamptz,
      completed_at timestamptz,
      cancelled_at timestamptz,
      deleted_attempt_count bigint CHECK (deleted_attempt_count IS NULL OR deleted_attempt_count >= 0),
      deleted_support_event_count bigint CHECK (deleted_support_event_count IS NULL OR deleted_support_event_count >= 0),
      deleted_achievement_snapshot_count bigint CHECK (deleted_achievement_snapshot_count IS NULL OR deleted_achievement_snapshot_count >= 0),
      deleted_conflict_count bigint CHECK (deleted_conflict_count IS NULL OR deleted_conflict_count >= 0),
      failure_code text CHECK (failure_code IS NULL OR failure_code ~ '^[a-z0-9_]{1,64}$')
    );

    CREATE UNIQUE INDEX account_data_one_active_request
      ON stemforge_account_data.requests (owner_id)
      WHERE status IN ('awaiting_reauthentication', 'awaiting_confirmation', 'scheduled', 'processing', 'failed_retryable');
    CREATE INDEX account_data_scheduled_requests
      ON stemforge_account_data.requests (cancellation_deadline, request_id)
      WHERE status IN ('scheduled', 'failed_retryable');
    CREATE INDEX account_data_owner_requests
      ON stemforge_account_data.requests (owner_id, created_at DESC);

    CREATE TABLE stemforge_account_data.reauthentication_proofs (
      proof_hash text PRIMARY KEY CHECK (proof_hash ~ '^[a-f0-9]{64}$'),
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      request_id uuid NOT NULL REFERENCES stemforge_account_data.requests(request_id),
      session_binding_hash text NOT NULL CHECK (session_binding_hash ~ '^[a-f0-9]{64}$'),
      request_type text NOT NULL CHECK (request_type = 'learning_progress_erasure'),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      expires_at timestamptz NOT NULL,
      consumed_at timestamptz
    );
    CREATE INDEX account_data_proof_expiry ON stemforge_account_data.reauthentication_proofs (expires_at);

    ALTER TABLE stemforge_remote.question_attempts ADD COLUMN account_generation bigint NOT NULL DEFAULT 1 CHECK (account_generation >= 1);
    ALTER TABLE stemforge_remote.support_events ADD COLUMN account_generation bigint NOT NULL DEFAULT 1 CHECK (account_generation >= 1);
    ALTER TABLE stemforge_remote.achievement_snapshots ADD COLUMN account_generation bigint NOT NULL DEFAULT 1 CHECK (account_generation >= 1);
    ALTER TABLE stemforge_remote.evidence_conflicts ADD COLUMN account_generation bigint NOT NULL DEFAULT 1 CHECK (account_generation >= 1);

    CREATE FUNCTION stemforge_account_data.verify_evidence_generation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE current_state stemforge_account_data.account_state%ROWTYPE;
    BEGIN
      SELECT * INTO current_state FROM stemforge_account_data.account_state WHERE owner_id = NEW.owner_id;
      IF NOT FOUND THEN
        IF NOT EXISTS (SELECT 1 FROM stemforge_identity.application_owners WHERE owner_id = NEW.owner_id) THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'STEM Forge account data is not active' USING ERRCODE = '55000';
      END IF;
      IF current_state.status <> 'active' THEN
        RAISE EXCEPTION 'STEM Forge account data is not active' USING ERRCODE = '55000';
      END IF;
      IF NEW.account_generation <> current_state.generation THEN
        RAISE EXCEPTION 'STEM Forge account generation mismatch' USING ERRCODE = '55000';
      END IF;
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER question_attempts_verify_generation BEFORE INSERT ON stemforge_remote.question_attempts
      FOR EACH ROW EXECUTE FUNCTION stemforge_account_data.verify_evidence_generation();
    CREATE TRIGGER support_events_verify_generation BEFORE INSERT ON stemforge_remote.support_events
      FOR EACH ROW EXECUTE FUNCTION stemforge_account_data.verify_evidence_generation();
    CREATE TRIGGER achievement_snapshots_verify_generation BEFORE INSERT ON stemforge_remote.achievement_snapshots
      FOR EACH ROW EXECUTE FUNCTION stemforge_account_data.verify_evidence_generation();
    CREATE TRIGGER evidence_conflicts_verify_generation BEFORE INSERT ON stemforge_remote.evidence_conflicts
      FOR EACH ROW EXECUTE FUNCTION stemforge_account_data.verify_evidence_generation();

    CREATE OR REPLACE FUNCTION stemforge_remote.reject_evidence_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE request_owner text;
    BEGIN
      IF TG_OP = 'DELETE' AND current_setting('stemforge.erasure_request_id', true) <> '' THEN
        SELECT owner_id INTO request_owner
          FROM stemforge_account_data.requests
          WHERE request_id = current_setting('stemforge.erasure_request_id', true)::uuid
            AND status = 'processing';
        IF request_owner IS NOT NULL AND OLD.owner_id = request_owner
           AND current_setting('stemforge.erasure_owner_id', true) = request_owner THEN
          RETURN OLD;
        END IF;
      END IF;
      RAISE EXCEPTION 'STEM Forge remote evidence is append-only: % is not permitted on %.%',
        TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME USING ERRCODE = '55000';
    END;
    $$;

    CREATE FUNCTION stemforge_account_data.process_learning_erasure(confirmed_request_id uuid)
    RETURNS TABLE (
      generation_after bigint, deleted_attempts bigint, deleted_support_events bigint,
      deleted_achievement_snapshots bigint, deleted_conflicts bigint
    )
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, stemforge_account_data, stemforge_remote
    AS $$
    DECLARE request_row stemforge_account_data.requests%ROWTYPE;
    DECLARE next_generation bigint;
    DECLARE attempts_count bigint;
    DECLARE support_count bigint;
    DECLARE snapshots_count bigint;
    DECLARE conflicts_count bigint;
    BEGIN
      SELECT * INTO request_row FROM stemforge_account_data.requests
        WHERE request_id = confirmed_request_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'erasure_request_not_found' USING ERRCODE = '22023'; END IF;
      IF request_row.status = 'completed' THEN
        RETURN QUERY SELECT request_row.generation_after, request_row.deleted_attempt_count,
          request_row.deleted_support_event_count, request_row.deleted_achievement_snapshot_count,
          request_row.deleted_conflict_count;
        RETURN;
      END IF;
      IF request_row.status NOT IN ('scheduled', 'processing', 'failed_retryable')
         OR request_row.cancellation_deadline IS NULL
         OR request_row.cancellation_deadline > clock_timestamp() THEN
        RAISE EXCEPTION 'erasure_request_not_ready' USING ERRCODE = '55000';
      END IF;

      PERFORM pg_advisory_xact_lock(hashtextextended('stemforge_owner:' || request_row.owner_id, 0));
      UPDATE stemforge_account_data.requests SET status = 'processing', irreversible_at = COALESCE(irreversible_at, clock_timestamp()),
        updated_at = clock_timestamp(), failure_code = NULL WHERE request_id = confirmed_request_id;
      UPDATE stemforge_account_data.account_state SET status = 'processing', state_version = state_version + 1,
        updated_at = clock_timestamp() WHERE owner_id = request_row.owner_id AND status <> 'processing';

      PERFORM set_config('stemforge.erasure_request_id', confirmed_request_id::text, true);
      PERFORM set_config('stemforge.erasure_owner_id', request_row.owner_id, true);

      DELETE FROM stemforge_remote.evidence_conflicts WHERE owner_id = request_row.owner_id;
      GET DIAGNOSTICS conflicts_count = ROW_COUNT;
      DELETE FROM stemforge_remote.question_attempts WHERE owner_id = request_row.owner_id;
      GET DIAGNOSTICS attempts_count = ROW_COUNT;
      DELETE FROM stemforge_remote.support_events WHERE owner_id = request_row.owner_id;
      GET DIAGNOSTICS support_count = ROW_COUNT;
      DELETE FROM stemforge_remote.achievement_snapshots WHERE owner_id = request_row.owner_id;
      GET DIAGNOSTICS snapshots_count = ROW_COUNT;

      UPDATE stemforge_account_data.account_state SET generation = generation + 1, status = 'active',
        state_version = state_version + 1, updated_at = clock_timestamp(), last_erased_at = clock_timestamp()
        WHERE owner_id = request_row.owner_id RETURNING generation INTO next_generation;
      UPDATE stemforge_account_data.requests SET status = 'completed', generation_after = next_generation,
        deleted_attempt_count = attempts_count, deleted_support_event_count = support_count,
        deleted_achievement_snapshot_count = snapshots_count, deleted_conflict_count = conflicts_count,
        completed_at = clock_timestamp(), updated_at = clock_timestamp()
        WHERE request_id = confirmed_request_id;
      RETURN QUERY SELECT next_generation, attempts_count, support_count, snapshots_count, conflicts_count;
    END;
    $$;

    REVOKE ALL ON FUNCTION stemforge_account_data.process_learning_erasure(uuid) FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_account_data.account_state FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_account_data.requests FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_account_data.reauthentication_proofs FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("Account data export and erasure is forward-only; destructive automatic rollback is intentionally unavailable.");
};
