"use client";

import { useRef } from "react";
import { MathContent } from "@/components/questions/math-content";
import { MathKeypad } from "@/components/questions/math-keypad";
import type { Question, QuestionOption } from "@/data/types";

type InputProps = {
  question: Question;
  value: string;
  submitted: boolean;
  onChange: (value: string) => void;
};

export function QuestionAnswerInput(props: InputProps) {
  if (props.question.answerType === "multiple_choice") return <MultipleChoiceInput {...props} options={props.question.options ?? []} />;
  if (props.question.answerType === "written") return <WrittenAnswerInput {...props} />;
  if (props.question.answerType === "multi_step") return <MultiStepInput {...props} />;
  if (props.question.answerType === "numerical") return <NumericalInput {...props} />;
  return <AlgebraicInput {...props} />;
}

export function MultipleChoiceInput({ value, submitted, onChange, options }: InputProps & { options: QuestionOption[] }) {
  return (
    <div className="grid gap-3">
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
  return <TextInput {...props} placeholder="Enter a number" helper="Use the keypad if helpful. Extra spaces are ignored when marking." showKeypad />;
}

export function AlgebraicInput(props: InputProps) {
  return <TextInput {...props} placeholder="Example: 5x^4" helper="Type powers with ^, for example 5x^4. You can also use * for multiplication." showKeypad />;
}

export function WrittenAnswerInput(props: InputProps) {
  return <TextAreaInput {...props} placeholder="Write your answer. Guided marking will be added later." />;
}

export function MultiStepInput(props: InputProps) {
  return <TextAreaInput {...props} placeholder="Show your working. Structured multi-step marking will be added later." />;
}

function TextInput({ value, submitted, onChange, placeholder, helper, showKeypad = false }: InputProps & { placeholder: string; helper?: string; showKeypad?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        aria-label="Your answer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={submitted}
        placeholder={placeholder}
        aria-describedby={submitted ? "answer-feedback" : undefined}
        className="min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-base outline-none transition focus:border-forge disabled:bg-line/40"
      />
      {helper ? <p className="mt-2 text-sm leading-relaxed text-muted">{helper}</p> : null}
      {showKeypad ? <MathKeypad value={value} onChange={onChange} inputRef={inputRef} disabled={submitted} /> : null}
    </div>
  );
}

function TextAreaInput({ value, submitted, onChange, placeholder }: InputProps & { placeholder: string }) {
  return (
    <textarea
      aria-label="Your answer"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={submitted}
      placeholder={placeholder}
      rows={4}
      className="min-h-28 w-full rounded-lg border border-line bg-white p-3.5 text-base outline-none transition focus:border-forge disabled:bg-line/40"
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

