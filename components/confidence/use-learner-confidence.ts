"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearLearnerConfidence,
  CONFIDENCE_LOCAL_STATE_UPDATED_EVENT,
  emptyConfidenceLocalState,
  readConfidenceLocalState,
  recordConfidenceOverride,
  setLearnerConfidence,
  writeConfidenceLocalState,
  type ConfidenceLocalState,
} from "@/lib/confidence/local-state";
import type { ConfidenceLevel, ConfidenceOverrideRecord, LearnerConfidence } from "@/lib/confidence/types";

/**
 * Shared learner-confidence state, read/written the same way regardless of which surface (Course
 * Tracker, Skill Page) is asking — one persistence boundary, one set of event listeners, so both
 * surfaces stay in sync without duplicating logic (Part H).
 */
export function useLearnerConfidence() {
  const [state, setState] = useState<ConfidenceLocalState>(() => emptyConfidenceLocalState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const read = () => {
      setState(readConfidenceLocalState(window.localStorage));
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT, read);
    };
  }, []);

  const persist = useCallback((next: ConfidenceLocalState) => {
    if (!writeConfidenceLocalState(window.localStorage, next)) return false;
    setState(next);
    window.dispatchEvent(new Event(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT));
    return true;
  }, []);

  const setRating = useCallback((skillPathId: string, level: ConfidenceLevel) => {
    return persist(setLearnerConfidence(state, skillPathId, level, new Date().toISOString()));
  }, [persist, state]);

  const clearRating = useCallback((skillPathId: string) => {
    return persist(clearLearnerConfidence(state, skillPathId));
  }, [persist, state]);

  const recordOverride = useCallback((record: ConfidenceOverrideRecord) => {
    return persist(recordConfidenceOverride(state, record));
  }, [persist, state]);

  const getRating = useCallback((skillPathId: string): LearnerConfidence | null => state.ratings[skillPathId] ?? null, [state]);
  const getOverride = useCallback((skillPathId: string): ConfidenceOverrideRecord | null => state.overrides[skillPathId] ?? null, [state]);

  return { loaded, ratings: state.ratings, overrides: state.overrides, getRating, getOverride, setRating, clearRating, recordOverride };
}

export type UseLearnerConfidenceResult = ReturnType<typeof useLearnerConfidence>;
