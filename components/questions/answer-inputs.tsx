"use client";

import { MathContent } from "@/components/questions/math-content";
import { GraphAnswerInput } from "@/components/questions/graph-answer-input";
import { RichMathAnswerField } from "@/components/questions/rich-math-answer-field";
import type { Question, QuestionOption } from "@/data/types";
import { deriveMathInputCapabilities, hasRichMathInputProfile } from "@/lib/questions/math-input-capabilities";

type InputProps = {
  question: Question;
  value: string;
  submitted: boolean;
  onChange: (value: string) => void;
  inputId?: string;
  describedBy?: string;
  invalid?: boolean;
};

export function QuestionAnswerInput(props: InputProps) {
  if (props.question.answerType === "graph_structured" || props.question.answerType === "nature_table") return <GraphAnswerInput {...props} />;
  if (props.question.answerType === "multiple_choice") return <MultipleChoiceInput {...props} options={props.question.options ?? []} />;
  if (props.question.answerType === "written") return <WrittenAnswerInput {...props} />;
  if (props.question.answerType === "multi_step") return <MultiStepInput {...props} />;
  if (props.question.answerType === "numerical") return <NumericalInput {...props} />;
  return <AlgebraicInput {...props} />;
}

export function MultipleChoiceInput({ value, submitted, onChange, options, describedBy, invalid }: InputProps & { options: QuestionOption[] }) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-labelledby="answer-label" aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      {options.map((option) => (
        <label key={option.value} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-line bg-white px-4 py-3 font-semibold">
          <input type="radio" name="answer" value={option.value} checked={value === option.value} disabled={submitted} onChange={() => onChange(option.value)} />
          <MathContent>{option.label}</MathContent>
        </label>
      ))}
    </div>
  );
}

export function NumericalInput(props: InputProps) {
  return <TextInput {...props} placeholder="Enter a number" helper="Extra spaces are ignored when marking." />;
}

export function AlgebraicInput(props: InputProps) {
  if (!hasRichMathInputProfile(props.question.marking)) {
    return (
      <TextInput
        {...props}
        placeholder={props.question.marking.strategy === "linear_equation_equivalence" ? "Enter an equation in x and y" : "Enter your answer"}
        helper="Equivalent forms are accepted when marking."
      />
    );
  }
  return <RichMathAnswerField value={props.value} onChange={props.onChange} capabilities={deriveMathInputCapabilities(props.question)} disabled={props.submitted} inputId={props.inputId ?? "question-answer"} describedBy={props.describedBy} invalid={props.invalid} />;
}

export function WrittenAnswerInput(props: InputProps) {
  return <TextAreaInput {...props} placeholder="Write your answer, then compare it with the worked solution." />;
}

export function MultiStepInput(props: InputProps) {
  if (props.question.marking.strategy === "multipart" && props.question.answerFields?.length) return <MultipartInput {...props} />;
  return <TextAreaInput {...props} placeholder="Show your working, then compare it with the worked solution." />;
}

function MultipartInput({ question, value, submitted, onChange, describedBy, invalid }: InputProps) {
  const answers = parseMultipartValue(value);
  const update = (id: string, next: string) => onChange(JSON.stringify({ ...answers, [id]: next }));
  return (
    <fieldset className="grid gap-4" aria-labelledby="answer-label" aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      <legend className="sr-only">Answer all assessed parts</legend>
      {question.answerFields?.map((field) => (
        <label key={field.id} className="grid gap-2 text-sm font-bold" htmlFor={`question-answer-${field.id}`}>
          <span>{field.label}</span>
          <input
            id={`question-answer-${field.id}`}
            data-testid={`answer-field-${field.id}`}
            value={answers[field.id] ?? ""}
            onChange={(event) => update(field.id, event.target.value)}
            disabled={submitted}
            autoComplete="off"
            inputMode={field.inputType === "numeric" ? "decimal" : "text"}
            placeholder={field.inputType === "line_equation" ? "Enter an equation in x and y" : field.inputType === "coordinate" ? "Enter (x, y)" : "Enter your answer"}
            aria-label={field.label}
            aria-describedby={describedBy}
            maxLength={4096}
            className="min-h-12 w-full rounded-lg border border-line bg-white px-4 text-lg font-normal outline-none transition focus:border-forge focus:ring-2 focus:ring-forge/15 disabled:bg-line/40"
          />
        </label>
      ))}
      <p className="text-sm font-normal text-muted">All labelled parts are assessed together. Marks are defined by the question, not by the number of fields.</p>
    </fieldset>
  );
}

function parseMultipartValue(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch { return {}; }
}

function TextInput({ value, submitted, onChange, placeholder, helper, inputId = "question-answer", describedBy, invalid }: InputProps & { placeholder: string; helper?: string }) {
  return (
    <div>
      <input
        id={inputId}
        aria-label="Your answer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={submitted}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        maxLength={4096}
        className="min-h-12 w-full rounded-lg border border-line bg-white px-4 text-lg outline-none transition focus:border-forge focus:ring-2 focus:ring-forge/15 disabled:bg-line/40"
      />
      {helper ? <p className="mt-2 text-sm leading-relaxed text-muted">{helper}</p> : null}
    </div>
  );
}

function TextAreaInput({ value, submitted, onChange, placeholder, inputId = "question-answer", describedBy, invalid }: InputProps & { placeholder: string }) {
  return (
    <textarea
      aria-label="Your answer"
      id={inputId}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={submitted}
      placeholder={placeholder}
      rows={4}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      maxLength={4096}
      className="min-h-28 w-full rounded-lg border border-line bg-white p-3.5 text-base outline-none transition focus:border-forge focus:ring-2 focus:ring-forge/15 disabled:bg-line/40"
    />
  );
}

export function FeedbackPanel({ correct, finalAnswer }: { correct: boolean; finalAnswer: React.ReactNode }) {
  return null;
}

export function SolutionPanel() {
  return null;
}

export function HintPanel() {
  return null;
}

export function CommonMistakePanel() {
  return null;
}
