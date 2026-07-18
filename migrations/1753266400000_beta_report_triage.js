exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE stemforge_operations.beta_reports
      ADD COLUMN severity text NOT NULL DEFAULT 'normal'
        CHECK (severity IN ('low', 'normal', 'high', 'critical')),
      ADD COLUMN reproduction_status text NOT NULL DEFAULT 'not_checked'
        CHECK (reproduction_status IN ('not_checked', 'unable_to_reproduce', 'reproduced', 'needs_more_information')),
      ADD COLUMN duplicate_of text REFERENCES stemforge_operations.beta_reports(report_id),
      ADD COLUMN state_version integer NOT NULL DEFAULT 1 CHECK (state_version > 0),
      ADD COLUMN triaged_at timestamptz,
      ADD COLUMN last_reviewed_at timestamptz,
      ADD CONSTRAINT beta_reports_not_self_duplicate CHECK (duplicate_of IS NULL OR duplicate_of <> report_id);

    ALTER TABLE stemforge_operations.beta_reports
      DROP CONSTRAINT IF EXISTS beta_reports_resolution_summary_check;
    ALTER TABLE stemforge_operations.beta_reports
      ADD CONSTRAINT beta_reports_resolution_summary_check
      CHECK (resolution_summary IS NULL OR length(resolution_summary) <= 2000);

    CREATE INDEX beta_reports_severity_status_created
      ON stemforge_operations.beta_reports (severity, status, created_at DESC, report_id DESC);
    CREATE INDEX beta_reports_updated
      ON stemforge_operations.beta_reports (updated_at DESC, report_id DESC);
    CREATE INDEX beta_reports_reproduction_created
      ON stemforge_operations.beta_reports (reproduction_status, created_at DESC, report_id DESC);
    CREATE INDEX beta_reports_page_area_created
      ON stemforge_operations.beta_reports (page_area, created_at DESC, report_id DESC);
    CREATE INDEX beta_reports_duplicate_of
      ON stemforge_operations.beta_reports (duplicate_of) WHERE duplicate_of IS NOT NULL;

    CREATE FUNCTION stemforge_operations.protect_beta_report_submission()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.report_id IS DISTINCT FROM OLD.report_id
        OR NEW.schema_version IS DISTINCT FROM OLD.schema_version
        OR NEW.kind IS DISTINCT FROM OLD.kind
        OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
        OR NEW.guest_session_id IS DISTINCT FROM OLD.guest_session_id
        OR NEW.contact_email IS DISTINCT FROM OLD.contact_email
        OR NEW.user_message IS DISTINCT FROM OLD.user_message
        OR NEW.page_path IS DISTINCT FROM OLD.page_path
        OR NEW.page_area IS DISTINCT FROM OLD.page_area
        OR NEW.app_version IS DISTINCT FROM OLD.app_version
        OR NEW.content_context IS DISTINCT FROM OLD.content_context
        OR NEW.diagnostic_context IS DISTINCT FROM OLD.diagnostic_context
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
      THEN
        RAISE EXCEPTION 'Beta report learner submission fields are immutable.';
      END IF;
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER beta_reports_protect_submission
      BEFORE UPDATE ON stemforge_operations.beta_reports
      FOR EACH ROW EXECUTE FUNCTION stemforge_operations.protect_beta_report_submission();

    CREATE TABLE stemforge_operations.beta_report_audit (
      audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      report_id text NOT NULL REFERENCES stemforge_operations.beta_reports(report_id),
      action_type text NOT NULL CHECK (action_type IN ('workflow_updated')),
      previous_state jsonb NOT NULL CHECK (octet_length(previous_state::text) <= 4000),
      next_state jsonb NOT NULL CHECK (octet_length(next_state::text) <= 4000),
      actor_owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE INDEX beta_report_audit_report_created
      ON stemforge_operations.beta_report_audit (report_id, created_at DESC, audit_id DESC);

    REVOKE ALL ON stemforge_operations.beta_reports FROM PUBLIC;
    REVOKE ALL ON stemforge_operations.beta_report_audit FROM PUBLIC;
    REVOKE ALL ON SEQUENCE stemforge_operations.beta_report_audit_audit_id_seq FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("Beta report triage migration is forward-only; destructive automatic rollback is intentionally unavailable.");
};
