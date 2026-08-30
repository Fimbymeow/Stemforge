import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BUTTON_VARIANT_CLASSES,
  PAGE_HEADER_ICON_CHIP_CLASSES,
  STATUS_PILL_VARIANT_CLASSES,
  SURFACE_LEVEL_CLASSES,
  StatusPill,
} from "../components/ui";
import { formatProgressStatusLabel } from "../components/learning/mastery-badge";
import { getReviewPresentationState } from "../components/learning/review-status";

test("mastery presentation uses the approved learner-facing progression", () => {
  assert.deepEqual(["not_started", "in_progress", "completed", "secure", "mastered"].map(formatProgressStatusLabel), ["Not started", "In progress", "Learned", "Secure", "Mastered"]);
});

test("Review presentation distinguishes base, available, recommended and due without changing scheduling", () => {
  assert.equal(getReviewPresentationState({ eligible: false, due: false, dueSoon: false }), "base");
  assert.equal(getReviewPresentationState({ eligible: true, due: false, dueSoon: false }), "available");
  assert.equal(getReviewPresentationState({ eligible: true, due: false, dueSoon: true }), "recommended");
  assert.equal(getReviewPresentationState({ eligible: true, due: true, dueSoon: false }), "due");
});

test("core redesigned surfaces retain the intended information hierarchy", () => {
  const skill = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  const dashboard = readFileSync("components/dashboard-local-progress.tsx", "utf8");
  const hub = readFileSync("components/higher-maths-hub.tsx", "utf8");
  const tracker = readFileSync("components/learning/course-tracker.tsx", "utf8");
  assert.equal((skill.match(/title="Notes"/g) ?? []).length, 1);
  assert.doesNotMatch(skill, /Next:/);
  assert.doesNotMatch(dashboard, /PracticeEntryCard|dashboard-practice|dashboard-review-summary|dashboard-mistakes-link|Needs attention|Secure and mastered|Needs work/);
  assert.match(dashboard, /Your courses/);
  assert.match(dashboard, /skills learned/);
  assert.match(hub, /SubjectRoadmapNavigator/);
  assert.doesNotMatch(hub, /PracticeEntryCard/);
  assert.doesNotMatch(hub, /View full Course Tracker/);
  assert.match(hub, />Courses</);
  assert.match(skill, /<details className="group\/requirements disclosure-motion/);
  assert.doesNotMatch(tracker, /group\/requirements/);
  assert.match(tracker, /Open \$\{skill\.name\} skill overview/);
});

test("shared visual primitives encode the restrained semantic hierarchy", () => {
  assert.match(SURFACE_LEVEL_CLASSES.primary, /rounded-2xl.*shadow-card/);
  assert.match(SURFACE_LEVEL_CLASSES.secondary, /rounded-xl.*border-line/);
  assert.doesNotMatch(SURFACE_LEVEL_CLASSES.secondary, /shadow/);
  assert.match(SURFACE_LEVEL_CLASSES.inline, /bg-paper/);

  assert.match(STATUS_PILL_VARIANT_CLASSES.forge, /bg-forge-soft.*text-forge/);
  assert.match(STATUS_PILL_VARIANT_CLASSES.success, /bg-success-soft.*text-success/);
  assert.match(STATUS_PILL_VARIANT_CLASSES.warning, /bg-warning-soft.*text-warning/);
  assert.match(STATUS_PILL_VARIANT_CLASSES.danger, /bg-danger-soft.*text-danger/);
  assert.match(BUTTON_VARIANT_CLASSES.destructive, /bg-danger.*text-white/);
  assert.match(PAGE_HEADER_ICON_CHIP_CLASSES, /size-10/);
  assert.match(PAGE_HEADER_ICON_CHIP_CLASSES, /rounded-lg/);
  assert.doesNotMatch(PAGE_HEADER_ICON_CHIP_CLASSES, /size-12|rounded-xl/);

  const warning = renderToStaticMarkup(
    StatusPill({ variant: "warning", dot: true, children: "Needs attention" }),
  );
  assert.match(warning, />Needs attention</);
  assert.match(warning, /aria-hidden="true"/);
});

test("canonical learning-page headers share the restrained icon-chip primitive", () => {
  for (const file of [
    "components/mistakes/mistake-log-page.tsx",
    "components/past-papers/past-papers-library.tsx",
    "components/higher-maths-hub.tsx",
    "components/subjects-page.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /<PageHeaderIconChip>/, `${file} does not use the shared page-header icon chip`);
  }
  assert.doesNotMatch(readFileSync("components/mistakes/mistake-log-page.tsx", "utf8"), /Practise these[\s\S]{0,500}disabled:opacity-45/);
});

test("known semantic-colour debt is removed without adding a depth-only palette", () => {
  const readiness = readFileSync("components/study-plan/assessment-readiness-section.tsx", "utf8");
  const mistakes = readFileSync("components/mistakes/mistake-log-page.tsx", "utf8");
  const notes = readFileSync("components/learning/lesson-renderer.tsx", "utf8");
  for (const [file, source] of [["readiness", readiness], ["mistakes", mistakes], ["notes", notes]] as const) {
    assert.doesNotMatch(source, /bg-amber-50|text-amber-900|bg-emerald-50|text-emerald-800|#76629b|#5d477e/, `${file} retains ad-hoc colour debt`);
  }
  assert.doesNotMatch(readFileSync("components/learning/icon-node-path.tsx", "utf8"), /#17466c/);
  assert.match(notes, /family === "depth"[\s\S]*border-forge\/35 text-forge/);
});

test("dialog and native disclosure foundations are adopted on representative surfaces", () => {
  const confidenceDialog = readFileSync("components/confidence/confidence-disagreement-dialog.tsx", "utf8");
  const reportDialog = readFileSync("components/beta-reports/report-dialog.tsx", "utf8");
  const studyPlanDialog = readFileSync("components/study-plan/study-plan-settings-dialog.tsx", "utf8");
  const globalCss = readFileSync("app/globals.css", "utf8");
  assert.match(confidenceDialog, /<DialogShell/);
  assert.match(reportDialog, /<DialogShell/);
  assert.match(studyPlanDialog, /<DialogShell/);
  assert.doesNotMatch(studyPlanDialog, /role="dialog"|aria-modal="true"|shadow-2xl/);
  assert.match(globalCss, /\.disclosure-motion::details-content/);
  assert.match(globalCss, /prefers-reduced-motion: reduce/);
  for (const file of [
    "components/practice/practice-setup.tsx",
    "components/learning/course-tracker.tsx",
    "components/learning/lesson-renderer.tsx",
    "components/mistakes/mistake-log-page.tsx",
  ]) {
    assert.match(readFileSync(file, "utf8"), /disclosure-motion/, `${file} has no representative native disclosure motion`);
  }
});

test("Study Plan uses restrained shared list and section-motion treatments", () => {
  const today = readFileSync("components/study-plan/study-plan-today.tsx", "utf8");
  const week = readFileSync("components/study-plan/study-plan-week.tsx", "utf8");
  const readiness = readFileSync("components/study-plan/assessment-readiness-section.tsx", "utf8");

  assert.match(today, /<ol className="[^"]*divide-y divide-line[^"]*"/);
  assert.match(week, /<ol className="[^"]*divide-y divide-line[^"]*"/);
  assert.doesNotMatch(today, /<ol className="[^"]*border-y[^"]*"/);
  assert.match(today, /<ol className="[^"]*animate-fade-rise[^"]*"/);
  assert.match(week, /<div className="animate-fade-rise">[\s\S]*groups\.map/);
  assert.match(readiness, /data-testid="assessment-readiness" className="[^"]*animate-fade-rise[^"]*"/);
});

test("Question Workspace and Practice Session use the shared visual foundations without a nested question card", () => {
  const workspace = readFileSync("components/questions/question-workspace.tsx", "utf8");
  const practiceSession = readFileSync("components/practice/practice-session.tsx", "utf8");
  const interactionClasses = workspace.match(/className="([^"]+)" data-testid="question-interaction"/)?.[1] ?? "";

  assert.doesNotMatch(interactionClasses, /(?:^|\s)(?:rounded\S*|border\S*|bg-white|shadow\S*)(?:\s|$)/);
  assert.equal((workspace.match(/disclosure-motion/g) ?? []).length, 2);
  assert.equal((practiceSession.match(/<DialogShell/g) ?? []).length, 2);
  assert.doesNotMatch(practiceSession, /role="dialog"|aria-modal="true"/);
});
