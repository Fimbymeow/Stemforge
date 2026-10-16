import "mathlive/static.css";
import "mathlive/fonts.css";
import { convertLatexToMarkup } from "mathlive/ssr";
import { markQuestionAnswer } from "../../lib/answer-engine";
import { deriveMathInputCapabilities } from "../../lib/questions/math-input-capabilities";
import { normalizeRichMathSource } from "../../lib/questions/rich-math-normalization";
import { publicChainRuleDemoQuestion } from "./chain-rule-demo-question";

if (publicChainRuleDemoQuestion.contentStatus !== "active"
    || publicChainRuleDemoQuestion.skillPathId !== "chain-rule"
    || publicChainRuleDemoQuestion.marking.strategy !== "composite_algebraic_equivalence") {
  throw new Error("The public Chain Rule demo question is unavailable or no longer compatible.");
}
const question = publicChainRuleDemoQuestion;

const root = document.querySelector<HTMLElement>("[data-chain-rule-demo]");
if (root) initializeDemo(root);

function initializeDemo(container: HTMLElement) {
  const questionHost = required<HTMLElement>(container, "[data-demo-question]");
  const marks = required<HTMLElement>(container, "[data-demo-marks]");
  const form = required<HTMLFormElement>(container, "[data-demo-answer-form]");
  const answerHost = required<HTMLElement>(container, "[data-demo-answer-host]");
  const fallbackInput = required<HTMLInputElement>(container, "#orthic-demo-answer");
  const feedback = required<HTMLElement>(container, "[data-demo-feedback]");
  const hintButton = required<HTMLButtonElement>(container, "[data-demo-hint-button]");
  const solutionButton = required<HTMLButtonElement>(container, "[data-demo-solution-button]");
  const hint = required<HTMLElement>(container, "[data-demo-hint]");
  const solution = required<HTMLElement>(container, "[data-demo-solution]");
  const continueLink = required<HTMLAnchorElement>(container, "[data-demo-continue]");
  const capabilities = deriveMathInputCapabilities(question);
  let mathField: import("mathlive").MathfieldElement | null = null;

  container.dataset.questionId = question.id;
  marks.textContent = `${question.marks} marks`;
  renderMathText(questionHost, question.questionText);
  renderMathText(hint, question.hint);
  renderMathText(solution, question.workedSolution);

  void import("mathlive").then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = null;
    MathfieldElement.soundsDirectory = null;
    const field = new MathfieldElement();
    field.id = fallbackInput.id;
    field.setAttribute("aria-labelledby", "demo-answer-label");
    field.setAttribute("aria-describedby", "demo-answer-help demo-feedback");
    field.setAttribute("data-demo-math-field", "");
    field.mathVirtualKeyboardPolicy = "auto";
    field.smartFence = true;
    field.smartSuperscript = true;
    field.menuItems = [];
    field.value = fallbackInput.value;
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      form.requestSubmit();
    });
    answerHost.replaceChildren(field);
    mathField = field;
  }).catch(() => {
    answerHost.dataset.fallback = "true";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const source = mathField?.getValue("latex") ?? fallbackInput.value;
    const normalized = normalizeRichMathSource(source, capabilities);
    if (normalized.status !== "ready") {
      showFeedback("Check the expression", normalizationMessage(normalized.status), "needs-attention");
      setInvalid(true);
      revealContinuation();
      return;
    }

    const result = markQuestionAnswer(question, normalized.canonical);
    if (result.outcomeKind === "graded" && result.isCorrect) {
      showFeedback("Correct", "Your expression is mathematically equivalent to the expected derivative.", "correct");
      setInvalid(false);
    } else if (result.outcomeKind === "graded") {
      showFeedback("Not quite", "Differentiate the outside power, then multiply by the derivative of the bracket.", "incorrect");
      setInvalid(true);
    } else {
      showFeedback("Check the expression", "Orthic could not safely mark that form. Enter one algebraic expression using x, brackets and powers.", "needs-attention");
      setInvalid(true);
    }
    revealContinuation();
  });

  hintButton.addEventListener("click", () => togglePanel(hintButton, hint, "Show hint", "Hide hint"));
  solutionButton.addEventListener("click", () => togglePanel(solutionButton, solution, "Show worked solution", "Hide worked solution"));

  function togglePanel(button: HTMLButtonElement, panel: HTMLElement, collapsed: string, expanded: string) {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
    button.textContent = willOpen ? expanded : collapsed;
    if (willOpen) revealContinuation();
  }

  function showFeedback(title: string, detail: string, state: string) {
    feedback.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = detail;
    feedback.append(heading, copy);
    feedback.dataset.state = state;
    feedback.hidden = false;
  }

  function setInvalid(invalid: boolean) {
    const input = mathField ?? fallbackInput;
    input.toggleAttribute("aria-invalid", invalid);
    if (invalid) input.focus();
  }

  function revealContinuation() {
    continueLink.hidden = false;
  }
}

function renderMathText(container: HTMLElement, source: string) {
  container.replaceChildren();
  let cursor = 0;
  let paragraph: HTMLParagraphElement | null = null;
  for (const match of source.trim().matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
    appendProse(source.slice(cursor, match.index));
    if (match[1] !== undefined) {
      paragraph = null;
      const math = document.createElement("div");
      math.className = "demo-math-display";
      math.innerHTML = convertLatexToMarkup(match[1].trim());
      container.append(math);
    } else {
      paragraph ??= appendParagraph();
      const math = document.createElement("span");
      math.className = "demo-math-inline";
      math.innerHTML = convertLatexToMarkup(match[2]);
      paragraph.append(math);
    }
    cursor = (match.index ?? 0) + match[0].length;
  }
  appendProse(source.slice(cursor));

  function appendProse(value: string) {
    const text = value.replace(/\s+/g, " ");
    if (!text.trim()) return;
    paragraph ??= appendParagraph();
    paragraph.append(document.createTextNode(text));
  }

  function appendParagraph() {
    const paragraph = document.createElement("p");
    container.append(paragraph);
    return paragraph;
  }
}

function normalizationMessage(status: string) {
  if (status === "incomplete") return "Finish the expression before checking it.";
  if (status === "unsupported") return "Use a single expression in x with brackets and whole-number powers.";
  return "Enter a complete algebraic expression before checking it.";
}

function required<T extends Element>(container: ParentNode, selector: string): T {
  const element = container.querySelector<T>(selector);
  if (!element) throw new Error(`Missing public demo element: ${selector}`);
  return element;
}
