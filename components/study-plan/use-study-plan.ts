"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import type { ProgressEvidence } from "@/lib/progress/types";
import { datesForAvailableDays } from "@/lib/study-plan/dates";
import {
  emptyStudyPlanLocalState,
  localCalendarDate,
  localDayKey,
  previousWeekFrom,
  readStudyPlanLocalState,
  STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT,
  type StudyPlanLocalState,
  type StudyPlanSetup,
  writeStudyPlanLocalState,
} from "@/lib/study-plan/local-state";
import {
  createInitialWeeklyPlan,
  moveWeeklyItem,
  pullForwardWeeklyItem,
  rebalanceStudyPlan,
  replaceWeeklyItem,
  todayPlanItems,
  updateWeeklyItemState,
} from "@/lib/study-plan/weekly-plan";
import type { StudyPlanRebalanceReason, StudyPlanWeeklyItem, StudyPlanWeeklyPlan } from "@/lib/study-plan/types";
import { premiumAssessmentContext } from "@/lib/premium-preview";

const EMPTY_PRESERVATION: StudyPlanLocalState["preservation"] = { itemStates: {}, movedDates: {}, excludedItemKeys: [] };

export function useStudyPlan(input: { evidence: ProgressEvidence; courseSlug: string; assessmentAware: boolean }) {
  const [state, setState] = useState<StudyPlanLocalState>(() => emptyStudyPlanLocalState());
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const confidence = useLearnerConfidence();
  // Self-reported "needs work" only ever softly nudges Study Plan candidates within a tier (Part R)
  // — a sibling of `preferences`, not nested inside it, so a confidence change causes the same soft
  // "evidence_changed"-style rebalance as ordinary evidence changes, never the hard `samePreferences`
  // reconcile path that assessment/weekly-minutes/day changes trigger.
  const learnerConfidenceMap = useMemo<ReadonlyMap<string, ConfidenceLevel>>(
    () => new Map(Object.values(confidence.ratings).map((rating) => [rating.skillPathId, rating.level])),
    [confidence.ratings],
  );

  const persist = useCallback((next: StudyPlanLocalState, nextMessage?: string) => {
    if (!writeStudyPlanLocalState(window.localStorage, next)) {
      setMessage("Your Study Plan change could not be saved on this browser.");
      return false;
    }
    setState(next);
    if (nextMessage) setMessage(nextMessage);
    window.dispatchEvent(new Event(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT));
    return true;
  }, []);

  useEffect(() => {
    const read = () => {
      setState(readStudyPlanLocalState(window.localStorage));
      setNow(new Date());
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, read);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !now || !state.setup) return;
    const preferences = { courseSlug: input.courseSlug, ...state.setup,
      assessments: [...premiumAssessmentContext(input.assessmentAware, state.setup.assessments)] };
    const calendarDate = localCalendarDate(now);
    const today = localDayKey(now);
    const current = state.plan;
    const missed = current?.items.some((item) => item.state === "planned" && item.scheduledDate !== null && item.scheduledDate < today) ?? false;
    const reason: StudyPlanRebalanceReason = missed ? "day_missed" : "evidence_changed";
    const plan = current
      ? rebalanceStudyPlan({ currentPlan: current, evidence: input.evidence, preferences, now, calendarDate, reason, learnerConfidence: learnerConfidenceMap })
      : createInitialWeeklyPlan({ evidence: input.evidence, preferences, now, calendarDate, learnerConfidence: learnerConfidenceMap }, state.preservation);
    if (current && planSignature(current) === planSignature(plan)) return;
    const rollover = current && current.weekStart !== plan.weekStart;
    persist({
      ...state,
      plan,
      previousWeek: rollover ? previousWeekFrom(current) : state.previousWeek,
      preservation: EMPTY_PRESERVATION,
    }, current && plan.rebalanceDiagnostics.planDistance > 0 ? adjustmentMessage(plan) : undefined);
  }, [input.assessmentAware, input.courseSlug, input.evidence, learnerConfidenceMap, loaded, now, persist, state]);

  const today = now ? localDayKey(now) : "";
  const plan = state.plan;
  const todayItems = useMemo(() => plan && today ? todayPlanItems(plan, today) : [], [plan, today]);
  const availableDates = useMemo(() => plan && state.setup
    ? datesForAvailableDays(plan.weekStart, state.setup.availableDays).filter((date) => date >= today)
    : [], [plan, state.setup, today]);

  function saveSetup(setup: StudyPlanSetup) {
    const actionNow = new Date();
    const preferences = { courseSlug: input.courseSlug, ...setup,
      assessments: [...premiumAssessmentContext(input.assessmentAware, setup.assessments)] };
    const calendarDate = localCalendarDate(actionNow);
    const plan = state.plan
      ? rebalanceStudyPlan({ currentPlan: state.plan, evidence: input.evidence, preferences, now: actionNow, calendarDate, reason: "preferences_changed", learnerConfidence: learnerConfidenceMap })
      : createInitialWeeklyPlan({ evidence: input.evidence, preferences, now: actionNow, calendarDate, learnerConfidence: learnerConfidenceMap }, state.preservation);
    const rollover = state.plan && state.plan.weekStart !== plan.weekStart;
    if (persist({ ...state, setup, plan, previousWeek: rollover ? previousWeekFrom(state.plan!) : state.previousWeek, preservation: EMPTY_PRESERVATION }, "Your plan has been updated.")) setNow(actionNow);
  }

  function refresh() {
    if (!plan || !state.setup) return;
    const actionNow = new Date();
    const next = rebalanceStudyPlan({
      currentPlan: plan,
      evidence: input.evidence,
      preferences: { courseSlug: input.courseSlug, ...state.setup,
        assessments: [...premiumAssessmentContext(input.assessmentAware, state.setup.assessments)] },
      now: actionNow,
      calendarDate: localCalendarDate(actionNow),
      reason: "explicit_refresh",
      learnerConfidence: learnerConfidenceMap,
    });
    persist({ ...state, plan: next }, next.rebalanceDiagnostics.planDistance > 0 ? adjustmentMessage(next) : "Your plan is already up to date.");
    setNow(actionNow);
  }

  function markItem(itemKey: string, itemState: "completed" | "skipped") {
    if (!plan) return;
    const next = updateWeeklyItemState(plan, itemKey, itemState, new Date());
    persist({ ...state, plan: next }, itemState === "completed" ? "Marked done for this plan." : "Skipped for this week.");
  }

  function moveItem(itemKey: string, date: string | null) {
    if (!plan || !today) return;
    const next = moveWeeklyItem(plan, itemKey, date, today, new Date());
    if (next === plan) return;
    persist({ ...state, plan: next }, date === null ? "Moved to later this week." : "Moved within this week.");
  }

  function swapItem(item: StudyPlanWeeklyItem) {
    if (!plan || !state.setup || !now) return false;
    const trialCurrent: StudyPlanWeeklyPlan = {
      ...plan,
      preservation: { ...plan.preservation, excludedItemKeys: [...new Set([...plan.preservation.excludedItemKeys, item.itemKey])] },
    };
    const trial = rebalanceStudyPlan({
      currentPlan: trialCurrent,
      evidence: input.evidence,
      preferences: { courseSlug: input.courseSlug, ...state.setup,
        assessments: [...premiumAssessmentContext(input.assessmentAware, state.setup.assessments)] },
      now,
      calendarDate: localCalendarDate(now),
      reason: "manual_swap",
      learnerConfidence: learnerConfidenceMap,
    });
    const existingKeys = new Set(plan.items.map((entry) => entry.itemKey));
    const alternative = trial.items.find((entry) => entry.state === "planned" && !existingKeys.has(entry.itemKey));
    if (!alternative) {
      setMessage("No other useful recommendation is available right now.");
      return false;
    }
    const next = replaceWeeklyItem(plan, item.itemKey, alternative, new Date());
    persist({ ...state, plan: next }, "Recommendation swapped.");
    return true;
  }

  function pullForward() {
    if (!plan || !today) return;
    const next = pullForwardWeeklyItem(plan, today, new Date());
    if (next === plan) return;
    persist({ ...state, plan: next }, "Added one more from later this week.");
  }

  return {
    loaded, state, plan, today, todayItems, availableDates, message,
    setMessage, saveSetup, refresh, markItem, moveItem, swapItem, pullForward,
  };
}

function planSignature(plan: StudyPlanWeeklyPlan) {
  return JSON.stringify({
    weekStart: plan.weekStart,
    preferences: plan.preferences,
    status: plan.status,
    caughtUp: plan.caughtUp,
    items: plan.items.map((item) => [item.itemKey, item.scheduledDate, item.state, item.reasonCode, item.manualOverride]),
    preservation: plan.preservation,
  });
}

function adjustmentMessage(plan: StudyPlanWeeklyPlan) {
  const removed = plan.rebalanceDiagnostics.itemsRemoved;
  return removed > 0
    ? "Plan adjusted. Some lower-priority work moved out of this week."
    : "Plan adjusted. Your week changed, so Orthic reprioritised the remaining work.";
}
