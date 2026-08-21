exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE stemforge_account_data.study_plan_settings (
      owner_id text PRIMARY KEY REFERENCES stemforge_identity.application_owners(owner_id),
      weekly_minutes integer NOT NULL CHECK (weekly_minutes BETWEEN 1 AND 10080),
      available_days text[] NOT NULL CHECK (
        cardinality(available_days) BETWEEN 1 AND 7
        AND available_days <@ ARRAY['mon','tue','wed','thu','fri','sat','sun']::text[]
      ),
      changed_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );

    CREATE TABLE stemforge_account_data.learner_assessments (
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      assessment_id text NOT NULL CHECK (char_length(assessment_id) BETWEEN 1 AND 200),
      course_slug text CHECK (course_slug IS NULL OR char_length(course_slug) BETWEEN 1 AND 120),
      assessment_type text CHECK (assessment_type IS NULL OR assessment_type IN ('class_test','prelim','final_exam','other')),
      title text CHECK (title IS NULL OR char_length(title) BETWEEN 1 AND 200),
      assessment_date jsonb CHECK (assessment_date IS NULL OR jsonb_typeof(assessment_date)='object'),
      scope jsonb CHECK (scope IS NULL OR jsonb_typeof(scope)='object'),
      source text CHECK (source IS NULL OR source IN ('learner','orthic_provisional','official')),
      content_fingerprint text CHECK (content_fingerprint IS NULL OR content_fingerprint ~ '^[a-f0-9]{64}$'),
      deleted boolean NOT NULL DEFAULT false,
      changed_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (owner_id, assessment_id),
      CHECK (deleted OR (course_slug IS NOT NULL AND assessment_type IS NOT NULL AND title IS NOT NULL
        AND assessment_date IS NOT NULL AND scope IS NOT NULL AND source IS NOT NULL AND content_fingerprint IS NOT NULL))
    );
    CREATE INDEX learner_assessments_owner_content_active
      ON stemforge_account_data.learner_assessments(owner_id, content_fingerprint) WHERE NOT deleted;

    CREATE TABLE stemforge_account_data.learner_confidence (
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      skill_path_id text NOT NULL CHECK (char_length(skill_path_id) BETWEEN 1 AND 240),
      level text CHECK (level IS NULL OR level IN ('needs_work','developing','confident')),
      set_at timestamptz,
      rating_deleted boolean NOT NULL DEFAULT false,
      rating_changed_at timestamptz NOT NULL,
      override_payload jsonb CHECK (override_payload IS NULL OR jsonb_typeof(override_payload)='object'),
      override_deleted boolean NOT NULL DEFAULT true,
      override_changed_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (owner_id, skill_path_id),
      CHECK (rating_deleted OR (level IS NOT NULL AND set_at IS NOT NULL)),
      CHECK (override_deleted OR override_payload IS NOT NULL)
    );

    CREATE TABLE stemforge_account_data.study_plan_item_states (
      owner_id text NOT NULL REFERENCES stemforge_identity.application_owners(owner_id),
      week_start date NOT NULL,
      planner_version integer NOT NULL CHECK (planner_version BETWEEN 1 AND 1000),
      item_key text NOT NULL CHECK (char_length(item_key) BETWEEN 1 AND 240),
      item_state text CHECK (item_state IS NULL OR item_state IN ('completed','skipped')),
      moved_date date,
      excluded boolean NOT NULL DEFAULT false,
      unscheduled boolean NOT NULL DEFAULT false,
      changed_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (owner_id, week_start, planner_version, item_key)
    );

    REVOKE TRUNCATE ON stemforge_account_data.study_plan_settings,
      stemforge_account_data.learner_assessments,
      stemforge_account_data.learner_confidence,
      stemforge_account_data.study_plan_item_states FROM PUBLIC;

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
      DELETE FROM stemforge_account_data.study_plan_item_states WHERE owner_id=request_row.owner_id;
      DELETE FROM stemforge_account_data.learner_confidence WHERE owner_id=request_row.owner_id;
      DELETE FROM stemforge_account_data.learner_assessments WHERE owner_id=request_row.owner_id;
      DELETE FROM stemforge_account_data.study_plan_settings WHERE owner_id=request_row.owner_id;
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
  throw new Error("Account learner state is forward-only; destructive automatic rollback is intentionally unavailable.");
};
