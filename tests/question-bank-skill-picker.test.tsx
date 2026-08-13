import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SkillFilterPicker, filterSkillPickerOptions } from "../components/question-bank-skill-picker";

function renderCollapsedSkills(count: number) {
  const options = Array.from({ length: count }, (_, index) => ({ id: `skill-${index + 1}`, name: `Skill ${index + 1}` }));
  return renderToStaticMarkup(<SkillFilterPicker label="Skills" values={[]} onClear={() => undefined} onToggle={() => undefined} options={options} allLabel="All skills" mobile={false} />);
}

test("collapsed skill picker markup stays constant with a full 49-skill option set", () => {
  const twoSkills = renderCollapsedSkills(2);
  const fullCourse = renderCollapsedSkills(49);
  assert.equal(fullCourse, twoSkills);
  assert.match(fullCourse, /aria-expanded="false"/);
  assert.doesNotMatch(fullCourse, /skill-picker-options/);
});

test("skill picker search filters a full synthetic option set by learner-facing name", () => {
  const options = Array.from({ length: 49 }, (_, index) => ({ id: `skill-${index + 1}`, name: index === 33 ? "Chain rule" : `Skill ${index + 1}` }));
  assert.deepEqual(filterSkillPickerOptions(options, "  CHAIN  "), [{ id: "skill-34", name: "Chain rule" }]);
});
