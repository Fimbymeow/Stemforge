import assert from "node:assert/strict";
import test from "node:test";
import { markQuestionAnswer } from "../lib/answer-engine";
import type { LinearEquationEquivalenceMarkingContract } from "../lib/marking/types";

const fixtures = { correct: [], incorrect: [], malformed: [], unmarkable: [] };
function contract(target: string): LinearEquationEquivalenceMarkingContract {
  return { strategy: "linear_equation_equivalence", strategyVersion: 1, target, variables: ["x", "y"], fixtures };
}

test("affine x/y equations compare by exact proportional canonical coefficients", () => {
  const marking = contract("y=2x+3");
  for (const answer of ["y = 2x + 3", "y-5=2(x-1)", "2x-y+3=0", "4x-2y+6=0"]) {
    assert.equal(markQuestionAnswer({ marking }, answer).isCorrect, true, answer);
  }
  for (const answer of ["y=2x+4", "y=-2x+3", "2x-y+2=0"]) {
    assert.equal(markQuestionAnswer({ marking }, answer).isCorrect, false, answer);
  }
});

test("negative and fractional gradients and intercepts remain exact", () => {
  const negative = contract("y=-3x+2");
  assert.equal(markQuestionAnswer({ marking: negative }, "3x+y-2=0").isCorrect, true);
  const fractional = contract("y=(2/5)x+3");
  for (const answer of ["5y=2x+15", "y-5=(2/5)(x-5)", "2x-5y+15=0"]) {
    assert.equal(markQuestionAnswer({ marking: fractional }, answer).isCorrect, true, answer);
  }
});

test("non-equations, malformed equations and unsupported non-linear forms never become ordinary wrong answers", () => {
  const marking = contract("y=2x+3");
  assert.equal(markQuestionAnswer({ marking }, "2x+3").outcomeKind, "malformed");
  assert.equal(markQuestionAnswer({ marking }, "y=").outcomeKind, "malformed");
  assert.equal(markQuestionAnswer({ marking }, "y=2x=3").outcomeKind, "unmarkable");
  assert.equal(markQuestionAnswer({ marking }, "y=x^2+3").outcomeKind, "unmarkable");
  assert.equal(markQuestionAnswer({ marking }, "y=x(x+1)").outcomeKind, "unmarkable");
});
