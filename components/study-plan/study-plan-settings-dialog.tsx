"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatAssessmentListDate } from "@/components/study-plan/study-plan-item-row";
import { StudyRhythmFields } from "@/components/study-plan/study-rhythm-fields";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { presentAssessmentScopeSummary } from "@/lib/study-plan/presenter";
import { studyPlanCourseOptions, studyPlanRequirementScopeOptions, studyPlanScopeOptions } from "@/lib/study-plan/scope-options";
import { minutesToWeeklyHours, weeklyHoursToMinutes } from "@/lib/study-plan/weekly-time";
import type { StudyPlanSetup } from "@/lib/study-plan/local-state";
import type { Assessment, AssessmentType, StudyPlanWeekday } from "@/lib/study-plan/types";

const ASSESSMENT_TYPE_OPTIONS: readonly { value: AssessmentType; label: string }[] = [
  { value: "class_test", label: "Class test" },
  { value: "prelim", label: "Prelim" },
  { value: "final_exam", label: "Final exam" },
  { value: "other", label: "Other" },
];

function createAssessmentId() {
  return `assessment:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

type DialogView = "settings" | "assessment_form";

export function StudyPlanSettingsDialog({ open, onClose, courseSlug, courseName, initial, assessmentFeaturesEnabled, onSave }: {
  open: boolean;
  onClose: () => void;
  courseSlug: string;
  courseName: string;
  initial: StudyPlanSetup | null;
  assessmentFeaturesEnabled: boolean;
  onSave: (setup: StudyPlanSetup) => void;
}) {
  const [weeklyHours, setWeeklyHours] = useState(() => minutesToWeeklyHours(initial?.weeklyMinutes ?? 90));
  const [availableDays, setAvailableDays] = useState<StudyPlanWeekday[]>(initial?.availableDays ?? ["mon", "wed", "sat"]);
  const [assessments, setAssessments] = useState<Assessment[]>(initial?.assessments ?? []);
  const [view, setView] = useState<DialogView>("settings");
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Reset the working copy from `initial` every time the dialog opens, so an unsaved edit from a
  // previous open-then-cancel cycle never leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setWeeklyHours(minutesToWeeklyHours(initial?.weeklyMinutes ?? 90));
    setAvailableDays(initial?.availableDays ?? ["mon", "wed", "sat"]);
    setAssessments(initial?.assessments ?? []);
    setView("settings");
    setEditingAssessmentId(null);
    setConfirmDeleteId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useModalFocusTrap({ open, containerRef: dialogRef, initialFocusRef: closeRef, onClose });

  if (!open) return null;

  const editingAssessment = editingAssessmentId ? assessments.find((item) => item.id === editingAssessmentId) ?? null : null;

  function saveAssessment(assessment: Assessment) {
    setAssessments((current) => {
      const exists = current.some((item) => item.id === assessment.id);
      return exists ? current.map((item) => item.id === assessment.id ? assessment : item) : [...current, assessment];
    });
    setView("settings");
    setEditingAssessmentId(null);
  }

  function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ weeklyMinutes: weeklyHoursToMinutes(weeklyHours), availableDays, assessments });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4" role="presentation">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border border-line bg-white p-5 shadow-2xl">
        {view === "assessment_form" ? (
          <AssessmentForm
            defaultCourseSlug={courseSlug}
            initial={editingAssessment}
            onCancel={() => { setView("settings"); setEditingAssessmentId(null); }}
            onSave={saveAssessment}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-extrabold uppercase text-forge">Study Plan</p>
                <h2 id={titleId} className="mt-1 text-2xl font-extrabold">{initial ? "Plan settings" : "Plan your study week"}</h2>
                <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">Set a realistic rhythm for {courseName}. You can change it at any time.</p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Close plan settings" className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitSettings} className="mt-5 grid gap-5">
              <StudyRhythmFields
                weeklyHours={weeklyHours}
                availableDays={availableDays}
                onWeeklyHoursChange={setWeeklyHours}
                onAvailableDaysChange={setAvailableDays}
              />

              {assessmentFeaturesEnabled ? <div data-testid="premium-assessment-settings">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">Assessments <span className="font-normal text-muted">(optional)</span></h3>
                  <button type="button" onClick={() => { setEditingAssessmentId(null); setView("assessment_form"); }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line px-3 text-xs font-extrabold text-forge hover:border-forge">
                    <Plus aria-hidden="true" className="size-3.5" /> Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">Tests, prelims or your final exam. Orthic brings related topics forward as they get closer, without freezing the rest of the course.</p>
                {assessments.length === 0 ? (
                  <p className="mt-3 rounded-lg bg-paper p-3 text-xs text-muted">No assessments added yet.</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {assessments.map((assessment) => (
                      <li key={assessment.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{assessment.title}</p>
                          <p className="text-xs text-muted">
                            {assessment.date.precision === "exact" ? formatAssessmentListDate(assessment.date.date) : "date to be confirmed"}
                            {" · "}
                            {presentAssessmentScopeSummary(assessment.scope, assessment.courseSlug)}
                          </p>
                        </div>
                        {confirmDeleteId === assessment.id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" onClick={() => { setAssessments((current) => current.filter((item) => item.id !== assessment.id)); setConfirmDeleteId(null); }} className="min-h-10 rounded-lg bg-danger px-2.5 text-xs font-extrabold text-white">Remove</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="min-h-10 rounded-lg border border-line px-2.5 text-xs font-bold">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" aria-label={`Edit ${assessment.title}`} onClick={() => { setEditingAssessmentId(assessment.id); setView("assessment_form"); }} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"><Pencil className="size-4" /></button>
                            <button type="button" aria-label={`Remove ${assessment.title}`} onClick={() => setConfirmDeleteId(assessment.id)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-muted hover:bg-paper hover:text-danger"><Trash2 className="size-4" /></button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div> : null}

              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={availableDays.length === 0 || !Number.isFinite(weeklyHours) || weeklyHours <= 0} className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-50">{initial ? "Save plan" : "Create my plan"}</button>
                <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-line px-5 text-sm font-extrabold">Cancel</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function AssessmentForm({ defaultCourseSlug, initial, onSave, onCancel }: {
  defaultCourseSlug: string;
  initial: Assessment | null;
  onSave: (assessment: Assessment) => void;
  onCancel: () => void;
}) {
  const [assessmentCourseSlug, setAssessmentCourseSlug] = useState(initial?.courseSlug ?? defaultCourseSlug);
  const [type, setType] = useState<AssessmentType>(initial?.type ?? "class_test");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial && initial.date.precision === "exact" ? initial.date.date : "");
  const [scopeKind, setScopeKind] = useState<Assessment["scope"]["kind"]>(initial?.scope.kind ?? "whole_course");
  const [topicIds, setTopicIds] = useState<string[]>(initial?.scope.kind === "topics" ? initial.scope.topicIds : []);
  const [skillPathIds, setSkillPathIds] = useState<string[]>(initial?.scope.kind === "skills" ? initial.scope.skillPathIds : []);
  const [specPointIds, setSpecPointIds] = useState<string[]>(initial?.scope.kind === "requirements" ? initial.scope.specPointIds : []);
  const closeRef = useRef<HTMLButtonElement>(null);

  const courseOptions = useMemo(() => studyPlanCourseOptions(), []);
  const areas = useMemo(() => studyPlanScopeOptions(assessmentCourseSlug), [assessmentCourseSlug]);
  const requirementAreas = useMemo(() => studyPlanRequirementScopeOptions(assessmentCourseSlug), [assessmentCourseSlug]);
  const resolvedSkillIds = useMemo(() => resolveSkillsForRequirements(specPointIds), [specPointIds]);
  const skillAvailabilityById = useMemo(() => new Map(
    areas.flatMap((area) => area.topics).flatMap((topic) => topic.skills).map((skill) => [skill.skillPathId, skill.isAvailable]),
  ), [areas]);
  const resolvedAvailableCount = resolvedSkillIds.filter((id) => skillAvailabilityById.get(id)).length;

  useEffect(() => { closeRef.current?.focus(); }, []);

  // A scope built from one subject's topics/skills/requirements is meaningless for another
  // subject, so switching Subject resets to the safe, always-valid "whole course" state rather
  // than carrying over foreign canonical IDs.
  function handleCourseChange(nextCourseSlug: string) {
    setAssessmentCourseSlug(nextCourseSlug);
    setScopeKind("whole_course");
    setTopicIds([]);
    setSkillPathIds([]);
    setSpecPointIds([]);
  }

  function toggleGroup(current: string[], groupIds: string[], setValue: (next: string[]) => void) {
    const allSelected = groupIds.length > 0 && groupIds.every((id) => current.includes(id));
    setValue(allSelected ? current.filter((id) => !groupIds.includes(id)) : [...new Set([...current, ...groupIds])]);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date) return;
    if (scopeKind === "topics" && topicIds.length === 0) return;
    if (scopeKind === "skills" && skillPathIds.length === 0) return;
    if (scopeKind === "requirements" && specPointIds.length === 0) return;
    const scope: Assessment["scope"] = scopeKind === "whole_course" ? { kind: "whole_course" }
      : scopeKind === "topics" ? { kind: "topics", topicIds }
      : scopeKind === "requirements" ? { kind: "requirements", specPointIds }
      : { kind: "skills", skillPathIds };
    onSave({
      id: initial?.id ?? createAssessmentId(),
      courseSlug: assessmentCourseSlug,
      type,
      title: title.trim(),
      date: { precision: "exact", date },
      scope,
      source: "learner",
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-extrabold uppercase text-forge">Study Plan</p>
          <h2 className="mt-1 text-xl font-extrabold">{initial ? "Edit assessment" : "Add assessment"}</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onCancel} aria-label="Back to plan settings" className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="grid max-w-xs gap-1 text-sm font-bold">
          Subject
          <select value={assessmentCourseSlug} onChange={(event) => handleCourseChange(event.target.value)} className={inputClass}>
            {courseOptions.map((option) => <option key={option.courseSlug} value={option.courseSlug}>{option.courseName}</option>)}
          </select>
        </label>
        <label className="grid max-w-xs gap-1 text-sm font-bold">
          Type
          <select value={type} onChange={(event) => setType(event.target.value as AssessmentType)} className={inputClass}>
            {ASSESSMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} placeholder="e.g. Unit 2 class test" className={inputClass} />
        </label>
        <label className="grid max-w-xs gap-1 text-sm font-bold">
          Date
          <input aria-label="Assessment date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className={inputClass} />
        </label>
        <fieldset>
          <legend className="text-sm font-bold">What&apos;s in it?</legend>
          <div className="mt-2 grid gap-2">
            <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
              <input type="radio" name="assessment-scope-kind" checked={scopeKind === "whole_course"} onChange={() => setScopeKind("whole_course")} /> Whole course
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
              <input type="radio" name="assessment-scope-kind" checked={scopeKind === "topics"} onChange={() => setScopeKind("topics")} /> Areas of the course
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
              <input type="radio" name="assessment-scope-kind" checked={scopeKind === "requirements"} onChange={() => setScopeKind("requirements")} /> Specification content
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
              <input type="radio" name="assessment-scope-kind" checked={scopeKind === "skills"} onChange={() => setScopeKind("skills")} /> Specific skills
            </label>
          </div>
          {scopeKind === "requirements" ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">Tick exactly what your teacher told you is on the test — Orthic works out which skills to prepare you for.</p>
          ) : null}

          {scopeKind === "topics" ? (
            <div className="mt-3 grid gap-3">
              {areas.map((area) => {
                const topicIdsInArea = area.topics.map((topic) => topic.topicScopeId);
                const selectedInArea = topicIdsInArea.filter((id) => topicIds.includes(id));
                const allSelected = topicIdsInArea.length > 0 && selectedInArea.length === topicIdsInArea.length;
                return (
                  <div key={area.courseAreaId} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold">{area.courseAreaName}</p>
                      {topicIdsInArea.length > 1 ? (
                        <button type="button" onClick={() => toggleGroup(topicIds, topicIdsInArea, setTopicIds)} className="text-xs font-bold text-forge hover:underline">
                          {allSelected ? "Clear" : "Select all"}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-1 grid gap-1 pl-1">
                      {area.topics.map((topic) => {
                        const checked = topicIds.includes(topic.topicScopeId);
                        return (
                          <label key={topic.topicScopeId} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                            <input type="checkbox" checked={checked} onChange={() => setTopicIds(checked ? topicIds.filter((id) => id !== topic.topicScopeId) : [...topicIds, topic.topicScopeId])} />
                            {topic.topicName}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {scopeKind === "requirements" ? (
            <div className="mt-3 grid gap-3">
              {requirementAreas.length === 0 ? (
                <p className="rounded-lg bg-paper p-3 text-xs text-muted">The official specification isn&apos;t available for this course yet.</p>
              ) : requirementAreas.map((area) => {
                const allPointIdsInArea = area.strands.flatMap((strand) => strand.requirements.map((requirement) => requirement.specPointId));
                const selectedInArea = allPointIdsInArea.filter((id) => specPointIds.includes(id));
                return (
                  <div key={area.courseAreaId} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold">{area.courseAreaName}</p>
                      <p className="text-xs text-muted">{selectedInArea.length > 0 ? `${selectedInArea.length} selected` : ""}</p>
                    </div>
                    <div className="mt-2 grid gap-1.5">
                      {area.strands.map((strand) => {
                        const strandPointIds = strand.requirements.map((requirement) => requirement.specPointId);
                        const selectedInStrand = strandPointIds.filter((id) => specPointIds.includes(id));
                        const allSelected = strandPointIds.length > 0 && selectedInStrand.length === strandPointIds.length;
                        return (
                          <details key={strand.strandId} open={selectedInStrand.length > 0} className="group rounded-lg border border-line px-3 py-2">
                            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
                              <span className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted transition-transform group-open:rotate-90" />
                                {strand.strandName}
                              </span>
                              <span className="text-xs font-normal text-muted">{selectedInStrand.length > 0 ? `${selectedInStrand.length} selected` : ""}</span>
                            </summary>
                            <div className="mt-2 grid gap-1 pl-1">
                              {strand.requirements.map((requirement) => {
                                const checked = specPointIds.includes(requirement.specPointId);
                                const partiallyCovered = requirement.totalSkillCount > 0 && requirement.availableSkillCount < requirement.totalSkillCount;
                                return (
                                  <label key={requirement.specPointId} className="flex min-h-10 cursor-pointer items-start gap-2 py-1 text-sm">
                                    <input
                                      type="checkbox"
                                      className="mt-1"
                                      checked={checked}
                                      onChange={() => setSpecPointIds(checked ? specPointIds.filter((id) => id !== requirement.specPointId) : [...specPointIds, requirement.specPointId])}
                                    />
                                    <span>
                                      <span className="block leading-snug">{requirement.wording}</span>
                                      {requirement.availableSkillCount === 0 ? <span className="mt-0.5 block text-xs font-normal text-muted">Not yet available in Orthic</span>
                                        : partiallyCovered ? <span className="mt-0.5 block text-xs font-normal text-muted">Partly available in Orthic so far</span> : null}
                                    </span>
                                  </label>
                                );
                              })}
                              {strandPointIds.length > 1 ? (
                                <button type="button" onClick={() => toggleGroup(specPointIds, strandPointIds, setSpecPointIds)} className="justify-self-start text-xs font-bold text-forge hover:underline">
                                  {allSelected ? "Clear" : "Select all"}
                                </button>
                              ) : null}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {specPointIds.length > 0 ? (
                <p className="rounded-lg bg-forge-soft px-3 py-2 text-xs font-bold text-forge" data-testid="requirement-scope-summary">
                  {specPointIds.length} specification requirement{specPointIds.length === 1 ? "" : "s"} selected — Orthic will prepare you across {resolvedSkillIds.length} skill{resolvedSkillIds.length === 1 ? "" : "s"}
                  {resolvedAvailableCount < resolvedSkillIds.length ? `, ${resolvedAvailableCount} of which ${resolvedAvailableCount === 1 ? "is" : "are"} available now` : ""}.
                </p>
              ) : null}
            </div>
          ) : null}

          {scopeKind === "skills" ? (
            <div className="mt-3 grid gap-3">
              {areas.map((area) => {
                const allSkillIdsInArea = area.topics.flatMap((topic) => topic.skills.map((skill) => skill.skillPathId));
                const selectedInArea = allSkillIdsInArea.filter((id) => skillPathIds.includes(id));
                return (
                  <div key={area.courseAreaId} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold">{area.courseAreaName}</p>
                      <p className="text-xs text-muted">{selectedInArea.length > 0 ? `${selectedInArea.length} selected` : ""}</p>
                    </div>
                    <div className="mt-2 grid gap-1.5">
                      {area.topics.map((topic) => {
                        const topicSkillIds = topic.skills.map((skill) => skill.skillPathId);
                        const selectedInTopic = topicSkillIds.filter((id) => skillPathIds.includes(id));
                        const allSelected = topicSkillIds.length > 0 && selectedInTopic.length === topicSkillIds.length;
                        return (
                          <details key={topic.topicScopeId} open={selectedInTopic.length > 0} className="group rounded-lg border border-line px-3 py-2">
                            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
                              <span className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted transition-transform group-open:rotate-90" />
                                {topic.topicName}
                              </span>
                              <span className="text-xs font-normal text-muted">{selectedInTopic.length > 0 ? `${selectedInTopic.length} selected` : ""}</span>
                            </summary>
                            <div className="mt-2 grid gap-1 pl-1">
                              {topic.skills.map((skill) => {
                                const checked = skillPathIds.includes(skill.skillPathId);
                                return (
                                  <label key={skill.skillPathId} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                                    <input type="checkbox" checked={checked} onChange={() => setSkillPathIds(checked ? skillPathIds.filter((id) => id !== skill.skillPathId) : [...skillPathIds, skill.skillPathId])} />
                                    <span>
                                      <span className="block">{skill.skillPathName}</span>
                                      {!skill.isAvailable ? <span className="block text-xs font-normal text-muted">Not yet available in Orthic</span> : null}
                                    </span>
                                  </label>
                                );
                              })}
                              {topicSkillIds.length > 1 ? (
                                <button type="button" onClick={() => toggleGroup(skillPathIds, topicSkillIds, setSkillPathIds)} className="justify-self-start text-xs font-bold text-forge hover:underline">
                                  {allSelected ? "Clear" : "Select all"}
                                </button>
                              ) : null}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">Save assessment</button>
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-line px-5 text-sm font-extrabold">Cancel</button>
        </div>
      </form>
    </>
  );
}

const inputClass = "min-h-11 rounded-lg border border-line bg-white px-3 text-base font-normal text-ink";
