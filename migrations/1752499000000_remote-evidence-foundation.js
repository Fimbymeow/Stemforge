exports.up = (pgm) => {
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS stemforge_remote;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE SEQUENCE stemforge_remote.evidence_receive_order_seq AS bigint;

    CREATE TABLE stemforge_remote.question_attempts (
      receive_order bigint PRIMARY KEY DEFAULT nextval('stemforge_remote.evidence_receive_order_seq'),
      owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 1 AND 200),
      event_id text NOT NULL CHECK (event_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
      payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
      payload_hash text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT question_attempts_owner_event_unique UNIQUE (owner_id, event_id)
    );

    CREATE TABLE stemforge_remote.support_events (
      receive_order bigint PRIMARY KEY DEFAULT nextval('stemforge_remote.evidence_receive_order_seq'),
      owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 1 AND 200),
      event_id text NOT NULL CHECK (event_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
      payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
      payload_hash text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT support_events_owner_event_unique UNIQUE (owner_id, event_id)
    );

    CREATE TABLE stemforge_remote.achievement_snapshots (
      receive_order bigint PRIMARY KEY DEFAULT nextval('stemforge_remote.evidence_receive_order_seq'),
      owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 1 AND 200),
      event_id text NOT NULL CHECK (event_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
      payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
      payload_hash text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT achievement_snapshots_owner_event_unique UNIQUE (owner_id, event_id)
    );

    CREATE TABLE stemforge_remote.evidence_conflicts (
      conflict_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      receive_order bigint NOT NULL DEFAULT nextval('stemforge_remote.evidence_receive_order_seq'),
      owner_id text NOT NULL CHECK (char_length(owner_id) BETWEEN 1 AND 200),
      evidence_kind text NOT NULL CHECK (evidence_kind IN ('attempt', 'support_event', 'achievement_snapshot')),
      event_id text NOT NULL CHECK (event_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
      accepted_payload_hash text NOT NULL CHECK (char_length(accepted_payload_hash) = 64),
      incoming_payload jsonb NOT NULL CHECK (jsonb_typeof(incoming_payload) = 'object'),
      incoming_payload_hash text NOT NULL,
      received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT evidence_conflicts_identity_unique UNIQUE (
        owner_id, evidence_kind, event_id, accepted_payload_hash, incoming_payload_hash
      )
    );

    CREATE INDEX question_attempts_owner_receive_idx
      ON stemforge_remote.question_attempts (owner_id, receive_order);
    CREATE INDEX support_events_owner_receive_idx
      ON stemforge_remote.support_events (owner_id, receive_order);
    CREATE INDEX achievement_snapshots_owner_receive_idx
      ON stemforge_remote.achievement_snapshots (owner_id, receive_order);
    CREATE INDEX evidence_conflicts_owner_receive_idx
      ON stemforge_remote.evidence_conflicts (owner_id, receive_order);

    CREATE FUNCTION stemforge_remote.set_evidence_payload_hash()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.payload_hash := encode(digest(convert_to(NEW.payload::text, 'UTF8'), 'sha256'), 'hex');
      RETURN NEW;
    END;
    $$;

    CREATE FUNCTION stemforge_remote.set_conflict_payload_hash()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.incoming_payload_hash := encode(digest(convert_to(NEW.incoming_payload::text, 'UTF8'), 'sha256'), 'hex');
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER question_attempts_set_hash
      BEFORE INSERT ON stemforge_remote.question_attempts
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.set_evidence_payload_hash();
    CREATE TRIGGER support_events_set_hash
      BEFORE INSERT ON stemforge_remote.support_events
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.set_evidence_payload_hash();
    CREATE TRIGGER achievement_snapshots_set_hash
      BEFORE INSERT ON stemforge_remote.achievement_snapshots
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.set_evidence_payload_hash();
    CREATE TRIGGER evidence_conflicts_set_hash
      BEFORE INSERT ON stemforge_remote.evidence_conflicts
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.set_conflict_payload_hash();

    CREATE FUNCTION stemforge_remote.reject_evidence_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'STEM Forge remote evidence is append-only: % is not permitted on %.%',
        TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
        USING ERRCODE = '55000';
    END;
    $$;

    CREATE TRIGGER question_attempts_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_remote.question_attempts
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER question_attempts_no_truncate
      BEFORE TRUNCATE ON stemforge_remote.question_attempts
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER support_events_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_remote.support_events
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER support_events_no_truncate
      BEFORE TRUNCATE ON stemforge_remote.support_events
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER achievement_snapshots_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_remote.achievement_snapshots
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER achievement_snapshots_no_truncate
      BEFORE TRUNCATE ON stemforge_remote.achievement_snapshots
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER evidence_conflicts_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_remote.evidence_conflicts
      FOR EACH ROW EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();
    CREATE TRIGGER evidence_conflicts_no_truncate
      BEFORE TRUNCATE ON stemforge_remote.evidence_conflicts
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_remote.reject_evidence_mutation();

    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_remote.question_attempts FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_remote.support_events FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_remote.achievement_snapshots FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_remote.evidence_conflicts FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("The remote evidence foundation is forward-only; destructive automatic rollback is intentionally unavailable.");
};
