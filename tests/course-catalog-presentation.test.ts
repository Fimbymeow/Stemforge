import assert from "node:assert/strict";
import test from "node:test";
import { groupCoursesByQualification } from "../lib/course-catalog-presentation";

test("course catalogue groups only represented qualifications in curriculum order", () => {
  const current = groupCoursesByQualification([
    { level: "Higher", subject: "Maths" },
    { level: "Higher", subject: "Physics" },
  ]);

  assert.deepEqual(current.map((group) => group.level), ["Higher"]);
  assert.equal(current[0].courses.length, 2);
});

test("qualification grouping remains compact and predictable for a future 12-course catalogue", () => {
  const subjects = ["Maths", "Physics", "Chemistry", "Biology"];
  const courses = ["Advanced Higher", "National 5", "Higher"].flatMap((level) =>
    subjects.map((subject) => ({ level, subject, name: `${level} ${subject}` })),
  );
  const groups = groupCoursesByQualification(courses);

  assert.deepEqual(groups.map((group) => group.level), ["National 5", "Higher", "Advanced Higher"]);
  assert.deepEqual(groups.map((group) => group.courses.length), [4, 4, 4]);
  assert.equal(groups[1].courses.findIndex((course) => course.name === "Higher Maths"), 0);
});
