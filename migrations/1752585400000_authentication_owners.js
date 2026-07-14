exports.up = (pgm) => {
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS stemforge_identity;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE stemforge_identity.application_owners (
      owner_id text PRIMARY KEY DEFAULT ('owner_' || replace(gen_random_uuid()::text, '-', '')),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT application_owners_opaque_id CHECK (owner_id ~ '^owner_[a-f0-9]{32}$')
    );

    CREATE TABLE stemforge_identity.external_auth_identities (
      provider text NOT NULL CHECK (provider ~ '^[a-z][a-z0-9_-]{0,63}$'),
      provider_subject text NOT NULL CHECK (char_length(provider_subject) BETWEEN 1 AND 200),
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (provider, provider_subject)
    );

    CREATE INDEX external_auth_identities_owner_idx
      ON stemforge_identity.external_auth_identities (owner_id);

    CREATE FUNCTION stemforge_identity.reject_identity_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'STEM Forge identity ownership is immutable: % is not permitted on %.%',
        TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
        USING ERRCODE = '55000';
    END;
    $$;

    CREATE TRIGGER application_owners_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_identity.application_owners
      FOR EACH ROW EXECUTE FUNCTION stemforge_identity.reject_identity_mutation();
    CREATE TRIGGER application_owners_no_truncate
      BEFORE TRUNCATE ON stemforge_identity.application_owners
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_identity.reject_identity_mutation();
    CREATE TRIGGER external_auth_identities_no_mutation
      BEFORE UPDATE OR DELETE ON stemforge_identity.external_auth_identities
      FOR EACH ROW EXECUTE FUNCTION stemforge_identity.reject_identity_mutation();
    CREATE TRIGGER external_auth_identities_no_truncate
      BEFORE TRUNCATE ON stemforge_identity.external_auth_identities
      FOR EACH STATEMENT EXECUTE FUNCTION stemforge_identity.reject_identity_mutation();

    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_identity.application_owners FROM PUBLIC;
    REVOKE UPDATE, DELETE, TRUNCATE ON stemforge_identity.external_auth_identities FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("The authenticated-owner foundation is forward-only; destructive automatic rollback is intentionally unavailable.");
};
