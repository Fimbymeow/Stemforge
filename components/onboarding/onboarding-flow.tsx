"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { OrthicWordmark } from "@/components/brand/orthic-mark";
import { useOnboardingEligibility } from "@/components/onboarding/use-onboarding-eligibility";
import { StudyRhythmFields } from "@/components/study-plan/study-rhythm-fields";
import { Button, Eyebrow, StatusPill, Surface } from "@/components/ui";
import { usePremiumPreview } from "@/components/premium-preview-provider";
import { courseCatalog } from "@/data/subjects";
import { MAX_FIRST_NAME_LENGTH } from "@/lib/learner-preferences";
import {
  ONBOARDING_UPDATED_EVENT,
  writeOnboardingState,
  type OnboardingStep,
} from "@/lib/onboarding";
import {
  readStudyPlanLocalState,
  STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT,
  writeStudyPlanLocalState,
} from "@/lib/study-plan/local-state";
import { weeklyHoursToMinutes } from "@/lib/study-plan/weekly-time";
import type { Assessment, AssessmentType, StudyPlanWeekday } from "@/lib/study-plan/types";

const DEFAULT_DAYS: StudyPlanWeekday[] = ["mon", "wed", "sat"];
const ASSESSMENT_TYPES: readonly { value: AssessmentType; label: string }[] = [
  { value: "class_test", label: "Class test" },
  { value: "prelim", label: "Prelim" },
  { value: "final_exam", label: "Final exam" },
  { value: "other", label: "Other" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eligibility = useOnboardingEligibility();
  const premiumPreview = usePremiumPreview();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState("");
  const liveCourses = useMemo(() => courseCatalog.filter((course) => course.available), []);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState(liveCourses.length === 1 ? liveCourses[0].slug : "");
  const [weeklyHours, setWeeklyHours] = useState(1.5);
  const [availableDays, setAvailableDays] = useState<StudyPlanWeekday[]>(DEFAULT_DAYS);
  const [addAssessment, setAddAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("class_test");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!eligibility.loaded) return;
    if (completed) return;
    if (eligibility.destination === "dashboard") {
      router.replace("/dashboard");
      return;
    }
    const requested = parseStep(searchParams.get("step"));
    const initial = requested ?? eligibility.onboarding?.step ?? 1;
    setStep(initial);
    setFirstName(eligibility.learner.preferences.firstName ?? "");
    setSelectedCourseSlug(eligibility.learner.preferences.selectedCourseSlugs[0] ?? (liveCourses.length === 1 ? liveCourses[0].slug : ""));
    persistOnboarding("in_progress", initial);
    if (!requested) router.replace(`/onboarding?step=${initial}`);
    setReady(true);
    // Initial hydration only. Step changes are driven by navigation below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, eligibility.loaded, eligibility.destination]);

  useEffect(() => {
    if (!ready || completed) return;
    const requested = parseStep(searchParams.get("step"));
    if (!requested || requested === step) return;
    setError(null);
    setStep(requested);
    persistOnboarding("in_progress", requested);
  }, [completed, ready, searchParams, step]);

  useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [completed, ready, step]);

  async function continueFromWelcome() {
    setBusy(true);
    setSaveWarning(null);
    const trimmed = firstName.trim();
    if (trimmed) {
      const saved = await eligibility.learner.save({
        ...eligibility.learner.preferences,
        firstName: trimmed,
      });
      if (!saved) setSaveWarning("We could not save your name just now. You can add it later from Account.");
    }
    setBusy(false);
    goToStep(2);
  }

  async function continueFromCourses() {
    if (!selectedCourseSlug) {
      setError("Choose an available course to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    const saved = await eligibility.learner.save({
      ...eligibility.learner.preferences,
      firstName: eligibility.learner.preferences.firstName ?? firstName,
      selectedCourseSlugs: [selectedCourseSlug],
    });
    if (!saved) setSaveWarning("We could not save that course just now. Higher Maths will still be available from Dashboard.");
    setBusy(false);
    goToStep(3);
  }

  async function finishWithPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (availableDays.length === 0) {
      setError("Choose at least one day you can study.");
      return;
    }
    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
      setError("Enter a weekly study time greater than zero.");
      return;
    }
    if (premiumPreview.enabled && addAssessment && (!assessmentTitle.trim() || !assessmentDate)) {
      setError("Add a name and date for the assessment, or leave it out for now.");
      return;
    }
    setBusy(true);
    const current = readStudyPlanLocalState(window.localStorage);
    const assessments = premiumPreview.enabled && addAssessment
      ? [createAssessment({ courseSlug: selectedCourseSlug, type: assessmentType, title: assessmentTitle, date: assessmentDate })]
      : [];
    const saved = writeStudyPlanLocalState(window.localStorage, {
      ...current,
      setup: { weeklyMinutes: weeklyHoursToMinutes(weeklyHours), availableDays, assessments },
      plan: null,
    });
    if (!saved) {
      setBusy(false);
      setError("Your study rhythm could not be saved in this browser. You can skip it and set up your plan later.");
      return;
    }
    window.dispatchEvent(new Event(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT));
    await completeOnboarding();
    setBusy(false);
  }

  async function skipStudyPlan() {
    setBusy(true);
    setError(null);
    await completeOnboarding();
    setBusy(false);
  }

  async function completeOnboarding() {
    const saved = await eligibility.learner.save({
      ...eligibility.learner.preferences,
      firstName: eligibility.learner.preferences.firstName ?? (firstName.trim() || null),
      selectedCourseSlugs: selectedCourseSlug ? [selectedCourseSlug] : eligibility.learner.preferences.selectedCourseSlugs,
      namePromptDismissed: true,
    });
    if (!saved) setSaveWarning("Some preferences could not be saved. You can review them later from Account.");
    persistOnboarding("completed", 3);
    setCompleted(true);
  }

  function goToStep(next: OnboardingStep) {
    setError(null);
    persistOnboarding("in_progress", next);
    router.push(`/onboarding?step=${next}`);
    setStep(next);
  }

  if (!eligibility.loaded || !ready) {
    return <main id="main-content" className="min-h-screen bg-paper" aria-label="Loading Orthic" />;
  }

  return (
    <main id="main-content" className="min-h-[100dvh] bg-paper px-4 py-6 text-ink sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col sm:min-h-[calc(100dvh-5rem)]">
        <div className="flex items-center justify-between gap-4">
          <OrthicWordmark />
          {!completed ? <StepIndicator step={step} /> : null}
        </div>

        <div className="flex flex-1 items-center py-8 sm:py-12">
          <div className={`w-full ${completed || step > 1 ? "animate-fade-rise" : "animate-hero-rise"}`}>
            {completed ? (
              <Completion headingRef={headingRef} warning={saveWarning} onContinue={() => router.replace("/dashboard")} />
            ) : step === 1 ? (
              <WelcomeStep
                headingRef={headingRef}
                firstName={firstName}
                busy={busy}
                warning={saveWarning}
                onFirstNameChange={setFirstName}
                onContinue={() => void continueFromWelcome()}
              />
            ) : step === 2 ? (
              <CourseStep
                headingRef={headingRef}
                selectedCourseSlug={selectedCourseSlug}
                busy={busy}
                error={error}
                warning={saveWarning}
                onSelect={setSelectedCourseSlug}
                onBack={() => goToStep(1)}
                onContinue={() => void continueFromCourses()}
                onContinueWithoutCourse={() => void completeOnboarding()}
              />
            ) : (
              <StudyRhythmStep
                headingRef={headingRef}
                weeklyHours={weeklyHours}
                availableDays={availableDays}
                assessmentEnabled={premiumPreview.enabled}
                addAssessment={addAssessment}
                assessmentType={assessmentType}
                assessmentTitle={assessmentTitle}
                assessmentDate={assessmentDate}
                busy={busy}
                error={error}
                onWeeklyHoursChange={setWeeklyHours}
                onAvailableDaysChange={setAvailableDays}
                onAddAssessmentChange={setAddAssessment}
                onAssessmentTypeChange={setAssessmentType}
                onAssessmentTitleChange={setAssessmentTitle}
                onAssessmentDateChange={setAssessmentDate}
                onBack={() => goToStep(2)}
                onSubmit={finishWithPlan}
                onSkip={() => void skipStudyPlan()}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function WelcomeStep({ headingRef, firstName, busy, warning, onFirstNameChange, onContinue }: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  firstName: string;
  busy: boolean;
  warning: string | null;
  onFirstNameChange: (value: string) => void;
  onContinue: () => void;
}) {
  return <section aria-labelledby="onboarding-title" className="mx-auto max-w-xl">
    <Eyebrow className="text-forge">Orthic</Eyebrow>
    <h1 ref={headingRef} tabIndex={-1} id="onboarding-title" className="mt-3 text-4xl font-extrabold leading-tight outline-none focus:outline-none sm:text-5xl">Welcome to Orthic</h1>
    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">Learn Scottish STEM with a clear path, useful practice and Review that adapts as you work.</p>
    <label className="mt-8 grid max-w-md gap-2 text-sm font-bold">
      What should we call you? <span className="font-normal text-muted">(optional)</span>
      <input
        autoComplete="given-name"
        value={firstName}
        maxLength={MAX_FIRST_NAME_LENGTH}
        onChange={(event) => onFirstNameChange(event.target.value)}
        className="min-h-12 rounded-lg border border-line bg-white px-4 text-base font-medium outline-none focus:border-forge focus:ring-2 focus:ring-forge/20"
      />
    </label>
    {warning ? <p role="status" className="mt-3 text-sm text-warning">{warning}</p> : null}
    <Button disabled={busy} onClick={onContinue} className="mt-6 min-w-32">Continue</Button>
  </section>;
}

function CourseStep({ headingRef, selectedCourseSlug, busy, error, warning, onSelect, onBack, onContinue, onContinueWithoutCourse }: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  selectedCourseSlug: string;
  busy: boolean;
  error: string | null;
  warning: string | null;
  onSelect: (slug: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onContinueWithoutCourse: () => void;
}) {
  const hasAvailableCourses = courseCatalog.some((course) => course.available);
  return <section aria-labelledby="onboarding-title">
    <Eyebrow className="text-forge">Your course</Eyebrow>
    <h1 ref={headingRef} tabIndex={-1} id="onboarding-title" className="mt-3 text-3xl font-extrabold leading-tight outline-none focus:outline-none sm:text-4xl">What are you studying?</h1>
    <p className="mt-3 text-base leading-relaxed text-muted">Choose the course you want Orthic to organise around first.</p>
    <div className="mt-7 grid gap-3" role="radiogroup" aria-label="Available courses">
      {courseCatalog.map((course) => {
        const checked = course.slug === selectedCourseSlug;
        return <label key={course.slug} className={`grid min-h-20 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-4 transition-[background-color,border-color,transform] duration-150 active:translate-y-px motion-reduce:transform-none ${course.available ? checked ? "border-forge bg-forge-soft" : "border-line bg-white hover:border-forge/45" : "cursor-not-allowed border-line bg-paper opacity-70"}`}>
          <span>
            <span className="block font-extrabold">{course.name}</span>
            <span className="mt-1 block text-sm text-muted">{course.available ? course.level : "Coming soon"}</span>
          </span>
          {course.available ? <>
            <input type="radio" name="onboarding-course" value={course.slug} checked={checked} onChange={() => onSelect(course.slug)} className="sr-only" />
            <span aria-hidden="true" className={`grid size-6 place-items-center rounded-full border ${checked ? "border-forge bg-forge text-white" : "border-line bg-white"}`}>{checked ? <Check className="size-4" /> : null}</span>
          </> : <StatusPill>Unavailable</StatusPill>}
        </label>;
      })}
    </div>
    {!hasAvailableCourses ? <p role="status" className="mt-4 rounded-lg bg-paper p-3 text-sm text-muted">No courses are available right now. You can continue to Dashboard and check again later.</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
    {warning ? <p role="status" className="mt-3 text-sm text-warning">{warning}</p> : null}
    <div className="mt-7 flex flex-wrap gap-3">
      <Button variant="quiet" onClick={onBack}><ChevronLeft aria-hidden="true" className="size-4" />Back</Button>
      <Button disabled={busy || (hasAvailableCourses && !selectedCourseSlug)} onClick={hasAvailableCourses ? onContinue : onContinueWithoutCourse}>{hasAvailableCourses ? "Continue" : "Continue to Dashboard"}</Button>
    </div>
  </section>;
}

function StudyRhythmStep(props: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  weeklyHours: number;
  availableDays: StudyPlanWeekday[];
  assessmentEnabled: boolean;
  addAssessment: boolean;
  assessmentType: AssessmentType;
  assessmentTitle: string;
  assessmentDate: string;
  busy: boolean;
  error: string | null;
  onWeeklyHoursChange: (value: number) => void;
  onAvailableDaysChange: (value: StudyPlanWeekday[]) => void;
  onAddAssessmentChange: (value: boolean) => void;
  onAssessmentTypeChange: (value: AssessmentType) => void;
  onAssessmentTitleChange: (value: string) => void;
  onAssessmentDateChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSkip: () => void;
}) {
  return <section aria-labelledby="onboarding-title">
    <Eyebrow className="text-forge">Study rhythm</Eyebrow>
    <h1 ref={props.headingRef} tabIndex={-1} id="onboarding-title" className="mt-3 text-3xl font-extrabold leading-tight outline-none focus:outline-none sm:text-4xl">Want Orthic to plan around your week?</h1>
    <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">Tell Orthic roughly when you study and what&apos;s coming up. You can change this anytime.</p>
    <form onSubmit={props.onSubmit} className="mt-7 grid gap-6">
      <Surface level="secondary" className="p-4 sm:p-5">
        <StudyRhythmFields
          weeklyHours={props.weeklyHours}
          availableDays={props.availableDays}
          onWeeklyHoursChange={props.onWeeklyHoursChange}
          onAvailableDaysChange={props.onAvailableDaysChange}
        />
      </Surface>
      {props.assessmentEnabled ? <Surface level="inline" className="p-4" data-testid="onboarding-assessment">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-extrabold">
          <input type="checkbox" checked={props.addAssessment} onChange={(event) => props.onAddAssessmentChange(event.target.checked)} className="size-5 accent-forge" />
          Add an upcoming assessment <span className="font-normal text-muted">(optional)</span>
        </label>
        {props.addAssessment ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">Type
            <select value={props.assessmentType} onChange={(event) => props.onAssessmentTypeChange(event.target.value as AssessmentType)} className={fieldClass}>
              {ASSESSMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">Date
            <input type="date" value={props.assessmentDate} onChange={(event) => props.onAssessmentDateChange(event.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">Assessment name
            <input value={props.assessmentTitle} maxLength={120} placeholder="e.g. Differentiation class test" onChange={(event) => props.onAssessmentTitleChange(event.target.value)} className={fieldClass} />
          </label>
          <p className="text-xs leading-relaxed text-muted sm:col-span-2">This starts with the whole course. You can narrow its scope later in Plan settings.</p>
        </div> : null}
      </Surface> : null}
      {props.error ? <p role="alert" className="text-sm text-danger">{props.error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="quiet" onClick={props.onBack}><ChevronLeft aria-hidden="true" className="size-4" />Back</Button>
        <Button type="submit" disabled={props.busy}>Finish setup</Button>
        <Button variant="quiet" disabled={props.busy} onClick={props.onSkip}>Skip for now</Button>
      </div>
    </form>
  </section>;
}

function Completion({ headingRef, warning, onContinue }: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  warning: string | null;
  onContinue: () => void;
}) {
  return <section aria-labelledby="onboarding-title" className="mx-auto max-w-xl text-center">
    <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success"><Check className="size-6" /></span>
    <h1 ref={headingRef} tabIndex={-1} id="onboarding-title" className="mt-5 text-4xl font-extrabold leading-tight outline-none focus:outline-none">Your Orthic is ready.</h1>
    <p className="mt-3 text-base text-muted">Let&apos;s get started.</p>
    {warning ? <p role="status" className="mt-4 text-sm text-warning">{warning}</p> : null}
    <Button onClick={onContinue} className="mt-7">Go to Dashboard</Button>
  </section>;
}

function StepIndicator({ step }: { step: OnboardingStep }) {
  return <div aria-label={`Step ${step} of 3`} className="flex items-center gap-3">
    <span className="text-xs font-extrabold text-muted">{step} / 3</span>
    <span aria-hidden="true" className="flex gap-1.5">
      {[1, 2, 3].map((value) => <span key={value} className={`h-1.5 w-7 rounded-full ${value <= step ? "bg-forge" : "bg-line"}`} />)}
    </span>
  </div>;
}

function persistOnboarding(status: "in_progress" | "completed", step: OnboardingStep) {
  if (writeOnboardingState(window.localStorage, { version: 1, status, step })) {
    window.dispatchEvent(new Event(ONBOARDING_UPDATED_EVENT));
  }
}

function parseStep(value: string | null): OnboardingStep | null {
  return value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : null;
}

function createAssessment(input: { courseSlug: string; type: AssessmentType; title: string; date: string }): Assessment {
  return {
    id: `assessment:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    courseSlug: input.courseSlug,
    type: input.type,
    title: input.title.trim(),
    date: { precision: "exact", date: input.date },
    scope: { kind: "whole_course" },
    source: "learner",
  };
}

const fieldClass = "min-h-11 rounded-lg border border-line bg-white px-3 text-sm font-medium outline-none focus:border-forge focus:ring-2 focus:ring-forge/20";
