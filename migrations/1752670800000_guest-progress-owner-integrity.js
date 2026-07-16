exports.up = (pgm) => {
  pgm.sql(`
    -- NOT VALID preserves any pre-authentication Sprint 12 rows while enforcing
    -- trusted application ownership for every new Sprint 14 import.
    ALTER TABLE stemforge_remote.question_attempts
      ADD CONSTRAINT question_attempts_owner_fk
      FOREIGN KEY (owner_id) REFERENCES stemforge_identity.application_owners(owner_id) NOT VALID;
    ALTER TABLE stemforge_remote.support_events
      ADD CONSTRAINT support_events_owner_fk
      FOREIGN KEY (owner_id) REFERENCES stemforge_identity.application_owners(owner_id) NOT VALID;
    ALTER TABLE stemforge_remote.achievement_snapshots
      ADD CONSTRAINT achievement_snapshots_owner_fk
      FOREIGN KEY (owner_id) REFERENCES stemforge_identity.application_owners(owner_id) NOT VALID;
    ALTER TABLE stemforge_remote.evidence_conflicts
      ADD CONSTRAINT evidence_conflicts_owner_fk
      FOREIGN KEY (owner_id) REFERENCES stemforge_identity.application_owners(owner_id) NOT VALID;
  `);
};

exports.down = () => {
  throw new Error("Guest progress owner integrity is forward-only; destructive automatic rollback is intentionally unavailable.");
};
