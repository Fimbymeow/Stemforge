"use client";

import { MathContent } from "@/components/questions/math-content";
import { GraphAnswerInput } from "@/components/questions/graph-answer-input";
import { RichMathAnswerField } from "@/components/questions/rich-math-answer-field";
import type { Question, QuestionOption } from "@/data/types";
import { deriveMathInputCapabilities } from "@/lib/questions/math-input-capabilities";

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
  return <RichMathAnswerField value={props.value} onChange={props.onChange} capabilities={deriveMathInputCapabilities(props.question)} disabled={props.submitted} inputId={props.inputId ?? "question-answer"} describedBy={props.describedBy} invalid={props.invalid} />;
}

export function WrittenAnswerInput(props: InputProps) {
  return <TextAreaInput {...props} placeholder="Write your answer, then compare it with the worked solution." />;
}

export function MultiStepInput(props: InputProps) {
  return <TextAreaInput {...props} placeholder="Show your working, then compare it with the worked solution." />;
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
