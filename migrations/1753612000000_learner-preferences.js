exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE stemforge_account_data.learner_preferences (
      owner_id text PRIMARY KEY REFERENCES stemforge_identity.application_owners(owner_id),
      first_name text CHECK (
        first_name IS NULL OR (
          char_length(first_name) BETWEEN 1 AND 40
          AND first_name = btrim(first_name)
        )
      ),
      name_prompt_dismissed boolean NOT NULL DEFAULT false,
      selected_course_slugs text[] NOT NULL DEFAULT '{}'::text[]
        CHECK (cardinality(selected_course_slugs) <= 32),
      created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    REVOKE TRUNCATE ON stemforge_account_data.learner_preferences FROM PUBLIC;

    DROP FUNCTION stemforge_account_data.process_learning_erasure(uuid);
    CREATE FUNCTION stemforge_account_data.process_learning_erasure(confirmed_request_id uuid)
    RETURNS TABLE (
      generation_after bigint, deleted_attempts bigint, deleted_support_events bigint,
      deleted_guided_self_assessments bigint, deleted_achievement_snapshots bigint,
      deleted_review_events bigint, deleted_flashcard_reviews bigint, deleted_conflicts bigint
    ) LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, stemforge_account_data, stemforge_remote AS $$
    DECLARE request_row stemforge_account_data.requests%ROWTYPE;
    DECLARE next_generation bigint;
    DECLARE attempts_count bigint; DECLARE support_count bigint; DECLARE self_assessments_count bigint;
    DECLARE snapshots_count bigint; DECLARE review_events_count bigint; DECLARE flashcard_reviews_count bigint;
    DECLARE conflicts_count bigint;
    BEGIN
      SELECT * INTO request_row FROM stemforge_account_data.requests WHERE request_id=confirmed_request_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'erasure_request_not_found' USING ERRCODE='22023'; END IF;
      IF request_row.status='completed' THEN
        RETURN QUERY SELECT request_row.generation_after, request_row.deleted_attempt_count,
          request_row.deleted_support_event_count, request_row.deleted_guided_self_assessment_count,
          request_row.deleted_achievement_snapshot_count, request_row.deleted_review_event_count,
          request_row.deleted_flashcard_review_count, request_row.deleted_conflict_count;
        RETURN;
      END IF;
      IF request_row.status NOT IN ('scheduled','processing','failed_retryable') OR request_row.cancellation_deadline IS NULL
         OR request_row.cancellation_deadline > clock_timestamp() THEN
        RAISE EXCEPTION 'erasure_request_not_ready' USING ERRCODE='55000';
      END IF;
      PERFORM pg_advisory_xact_lock(hashtextextended('stemforge_owner:' || request_row.owner_id, 0));
      UPDATE stemforge_account_data.requests SET status='processing', irreversible_at=COALESCE(irreversible_at,clock_timestamp()),
        updated_at=clock_timestamp(), failure_code=NULL WHERE request_id=confirmed_request_id;
      UPDATE stemforge_account_data.account_state SET status='processing', state_version=state_version+1,
        updated_at=clock_timestamp() WHERE owner_id=request_row.owner_id AND status<>'processing';
      PERFORM set_config('stemforge.erasure_request_id', confirmed_request_id::text, true);
      PERFORM set_config('stemforge.erasure_owner_id', request_row.owner_id, true);
      DELETE FROM stemforge_remote.evidence_conflicts WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS conflicts_count=ROW_COUNT;
      DELETE FROM stemforge_remote.question_attempts WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS attempts_count=ROW_COUNT;
      DELETE FROM stemforge_remote.support_events WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS support_count=ROW_COUNT;
      DELETE FROM stemforge_remote.guided_self_assessments WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS self_assessments_count=ROW_COUNT;
      DELETE FROM stemforge_remote.achievement_snapshots WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS snapshots_count=ROW_COUNT;
      DELETE FROM stemforge_remote.review_events WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS review_events_count=ROW_COUNT;
      DELETE FROM stemforge_remote.flashcard_reviews WHERE owner_id=request_row.owner_id; GET DIAGNOSTICS flashcard_reviews_count=ROW_COUNT;
      DELETE FROM stemforge_account_data.learner_preferences WHERE owner_id=request_row.owner_id;
      UPDATE stemforge_account_data.account_state SET generation=generation+1,status='active',state_version=state_version+1,
        updated_at=clock_timestamp(),last_erased_at=clock_timestamp() WHERE owner_id=request_row.owner_id RETURNING generation INTO next_generation;
      UPDATE stemforge_account_data.requests SET status='completed',generation_after=next_generation,
        deleted_attempt_count=attempts_count,deleted_support_event_count=support_count,
        deleted_guided_self_assessment_count=self_assessments_count,deleted_achievement_snapshot_count=snapshots_count,
        deleted_review_event_count=review_events_count,deleted_flashcard_review_count=flashcard_reviews_count,
        deleted_conflict_count=conflicts_count,completed_at=clock_timestamp(),updated_at=clock_timestamp()
        WHERE request_id=confirmed_request_id;
      RETURN QUERY SELECT next_generation,attempts_count,support_count,self_assessments_count,snapshots_count,
        review_events_count,flashcard_reviews_count,conflicts_count;
    END; $$;
    REVOKE ALL ON FUNCTION stemforge_account_data.process_learning_erasure(uuid) FROM PUBLIC;
  `);
};

exports.down = () => {
  throw new Error("Learner preferences are forward-only; destructive automatic rollback is intentionally unavailable.");
};
