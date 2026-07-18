exports.up = (pgm) => {
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS stemforge_operations;

    CREATE TABLE stemforge_operations.beta_reports (
      report_id text PRIMARY KEY CHECK (report_id ~ '^SF-[A-Z0-9]{10}$'),
      schema_version integer NOT NULL CHECK (schema_version = 1),
      kind text NOT NULL CHECK (kind IN ('bug', 'feedback', 'support_request', 'content_issue', 'account_issue')),
      status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'closed')),
      owner_id text REFERENCES stemforge_identity.application_owners(owner_id),
      guest_session_id text CHECK (guest_session_id IS NULL OR guest_session_id ~ '^[A-Za-z0-9_-]{8,80}$'),
      contact_email text CHECK (contact_email IS NULL OR length(contact_email) <= 254),
      user_message text NOT NULL CHECK (length(user_message) BETWEEN 3 AND 2000),
      page_path text NOT NULL CHECK (page_path ~ '^/' AND length(page_path) <= 300),
      page_area text CHECK (page_area IS NULL OR length(page_area) <= 80),
      app_version text NOT NULL CHECK (length(app_version) <= 80),
      content_context jsonb,
      diagnostic_context jsonb NOT NULL CHECK (octet_length(diagnostic_context::text) <= 5000),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      resolved_at timestamptz,
      resolution_summary text CHECK (resolution_summary IS NULL OR length(resolution_summary) <= 1000)
    );

    CREATE INDEX beta_reports_status_created ON stemforge_operations.beta_reports (status, created_at DESC);
    CREATE INDEX beta_reports_kind_created ON stemforge_operations.beta_reports (kind, created_at DESC);
    CREATE INDEX beta_reports_owner_created ON stemforge_operations.beta_reports (owner_id, created_at DESC) WHERE owner_id IS NOT NULL;
    CREATE INDEX beta_reports_guest_created ON stemforge_operations.beta_reports (guest_session_id, created_at DESC) WHERE guest_session_id IS NOT NULL;

    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_operations.beta_reports FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("Beta reports migration is forward-only; destructive automatic rollback is intentionally unavailable.");
};
