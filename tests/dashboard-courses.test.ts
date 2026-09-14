import assert from "node:assert/strict";
import test from "node:test";
import { selectDashboardCourses } from "../lib/dashboard-courses";

const courses = ["a", "b", "c", "d"].map((slug) => ({ slug, name: `Fixture ${slug}`, href: `/subjects/${slug}` }));
test("Dashboard shows zero, one or two courses without fabricating enrolments", () => {
  for (const count of [0, 1, 2, 3, 4]) assert.equal(selectDashboardCourses(courses.slice(0, count), null).length, Math.min(count, 2));
});
test("focus is first even when it is last in catalogue order", () => {
  assert.deepEqual(selectDashboardCourses(courses, "d").map((course) => course.slug), ["d", "a"]);
  assert.deepEqual(selectDashboardCourses(courses.slice(0, 2), "b").map((course) => course.slug), ["b", "a"]);
});
test("second course prefers supplied real attention without ranking scores", () => {
  assert.deepEqual(selectDashboardCourses(courses, "a", ["c"]).map((course) => course.slug), ["a", "c"]);
  assert.deepEqual(selectDashboardCourses(courses, "a", ["d", "c"]).map((course) => course.slug), ["a", "c"]);
});
test("missing focus or useful attention falls back to existing stable ordering", () => {
  assert.deepEqual(selectDashboardCourses(courses, "unavailable", ["unavailable"]).map((course) => course.slug), ["a", "b"]);
  const before = JSON.stringify(courses);
  assert.deepEqual(selectDashboardCourses(courses, "c", ["c"]).map((course) => course.slug), ["c", "a"]);
  assert.equal(JSON.stringify(courses), before);
});
