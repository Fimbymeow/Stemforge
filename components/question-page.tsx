// Legacy Higher Physics demo code. The active question engine is the Higher Maths QuestionWorkspace.
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  FunctionSquare,
  Gauge,
  MessageSquareWarning,
  PartyPopper,
  PenLine,
  Star,
  Target,
} from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { getQuestionById, getQuestionPosition, questions, type StemForgeQuestion } from "@/data/questions";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getLegacyPhysicsDemoAnswerState } from "@/lib/answer-engine";

type QuestionMode = "empty" | "demo";

export function QuestionPage({ mode, questionId = "motion-f-001" }: { mode: QuestionMode; questionId?: string }) {
  const demo = mode === "demo";
  const question = demo ? getQuestionById(questionId) ?? questions[0] : undefined;
  const position = question ? getQuestionPosition(question.id) : undefined;

  return (
    <AppShell demo={demo} active="Questions">
        <QuestionTopbar demo={demo} />
        <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-5">
            <Breadcrumbs demo={demo} question={question} />
            <QuestionHeaderCard demo={demo} question={question} position={position} />
            <QuestionCard demo={demo} question={question} position={position} />
            <SolutionPanel demo={demo} question={question} />
            <MistakeCard demo={demo} question={question} />
            <QuestionNavigation demo={demo} position={position} />
          </section>
          <QuestionProgressPanel demo={demo} question={question} position={position} />
        </div>
    </AppShell>
  );
}

function QuestionTopbar({ demo }: { demo: boolean }) {
  return (
    <div className="mx-auto mb-6 flex max-w-[1240px] justify-end">
      <AppTopbar demo={demo} />
    </div>
  );
}

function Breadcrumbs({ demo, question }: { demo: boolean; question?: StemForgeQuestion }) {
  const items = demo
    ? ["Subjects", question?.subject ?? "Higher Physics", question?.courseArea ?? "Our dynamic Universe", question?.specArea ?? "Motion - equations and graphs"]
    : ["Subjects", "Course", "Topic", "Question"];

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? "font-bold text-forge" : ""}>{item}</span>
          {index < items.length - 1 && <ChevronRight className="size-4" />}
        </span>
      ))}
    </nav>
  );
}

function QuestionHeaderCard({
  demo,
  question,
  position,
}: {
  demo: boolean;
  question?: StemForgeQuestion;
  position?: ReturnType<typeof getQuestionPosition>;
}) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <Badge>{question?.subject ?? (demo ? "Higher Physics" : "No course selected")}</Badge>
      <HeaderMeta label="Stage" value={question?.stage ?? "Not selected"} />
      <HeaderMeta label="Difficulty" value={question?.difficulty ?? "-"} badge />
      <HeaderMeta label="Marks" value={question ? String(question.marks) : "-"} />
      <HeaderMeta label="Time" value={question?.timeEstimate ?? "-"} />
      <HeaderMeta label="Progress" value={position ? `Question ${position.current} of ${position.total}` : "Question 0 of 0"} />
    </Card>
  );
}

function QuestionCard({
  demo,
  question,
  position,
}: {
  demo: boolean;
  question?: StemForgeQuestion;
  position?: ReturnType<typeof getQuestionPosition>;
}) {
  return (
    <Card className="p-6">
      {demo && question && position ? (
        <>
          <div className="rounded-2xl border border-line bg-white px-8 py-10 shadow-[0_18px_54px_rgba(17,17,17,0.04)] max-md:px-5">
            <p className="mb-6 font-mono text-[13px] font-extrabold uppercase text-forge">Question {position.current}</p>
            <p className="m-0 max-w-3xl text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.18]">
              {question.question}
            </p>
            <Link href="/resources" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white px-5 font-semibold shadow-sm">
              <FunctionSquare className="size-5" />
              Formula Sheet
            </Link>
            <AnswerInput demo question={question} />
          </div>
          <FeedbackState question={question} />
        </>
      ) : (
        <EmptyQuestionState />
      )}
    </Card>
  );
}

function AnswerInput({ demo, question }: { demo?: boolean; question?: StemForgeQuestion }) {
  return (
    <div className="mt-6">
      <label className="mb-2 block text-sm text-muted">Your answer</label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 max-md:grid-cols-1">
        <div className="flex min-h-14 overflow-hidden rounded-lg border border-line bg-white">
          <input
            value={demo ? question?.answer ?? "" : ""}
            readOnly
            placeholder="Enter your answer"
            className="min-w-0 flex-1 bg-transparent px-4 text-lg outline-none"
          />
          <span className="grid min-w-24 place-items-center border-l border-line bg-paper font-bold">
            {question?.answerUnit ?? "unit"}
          </span>
        </div>
        <button className="min-h-14 rounded-lg bg-forge px-8 font-extrabold text-white">Submit Answer</button>
      </div>
    </div>
  );
}

function FeedbackState({ question }: { question: StemForgeQuestion }) {
  const demoAnswer = getLegacyPhysicsDemoAnswerState(question);
  return (
    <div className="mt-5 flex items-center gap-5 rounded-xl border border-[#8ed0a6] bg-[#f1fbf4] p-5">
      <span className="grid size-10 place-items-center rounded-full bg-[#229954] text-white">
        <Check className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-xl font-extrabold">Correct!</h3>
        <p className="mt-2 text-muted">
          Correct: {demoAnswer.displayedAnswer} {demoAnswer.displayedUnit}. Well done. You&apos;ve got it.
        </p>
      </div>
      <PartyPopper className="size-9 text-forge max-sm:hidden" />
    </div>
  );
}

function SolutionPanel({ demo, question }: { demo: boolean; question?: StemForgeQuestion }) {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="m-0 text-2xl font-extrabold">Worked Solution</h2>
        <ChevronRight className="size-5 rotate-90" />
      </div>
      {demo && question ? (
        <div className="grid gap-6">
          {question.solution.map((step, index) => (
            <SolutionStep key={step.title} number={index + 1} title={step.title} equation={step.equation} note={step.note} />
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          A worked solution will appear after a question is loaded.
        </p>
      )}
    </Card>
  );
}

function MistakeCard({ demo, question }: { demo: boolean; question?: StemForgeQuestion }) {
  return (
    <Card className="p-6">
      <div className="flex gap-5">
        <MessageSquareWarning className="mt-1 size-6 shrink-0 text-forge" />
        <div>
          <h2 className="m-0 text-lg font-extrabold">Common mistake</h2>
          <p className="mt-3 text-muted">
            {demo
              ? question?.commonMistake
              : "Common mistakes will appear here once a question is loaded."}
          </p>
        </div>
      </div>
    </Card>
  );
}

function QuestionNavigation({ demo, position }: { demo: boolean; position?: ReturnType<typeof getQuestionPosition> }) {
  const previousHref = position?.previous ? `/question/${position.previous.id}` : "/subjects/higher-physics/our-dynamic-universe/motion-equations-and-graphs";
  const nextHref = position?.next ? `/question/${position.next.id}` : "/subjects/higher-physics/our-dynamic-universe/motion-equations-and-graphs";

  return (
    <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
      <Link href={previousHref} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-line bg-white font-bold">
        <ArrowLeft className="size-5" />
        Previous Question
      </Link>
      <button className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-line bg-white font-bold">
        <Bookmark className="size-5" />
        {demo ? "Bookmark Question" : "Save Question"}
      </button>
      <Link href={nextHref} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-forge font-bold text-white">
        Next Question
        <ArrowRight className="size-5" />
      </Link>
    </div>
  );
}

function QuestionProgressPanel({
  demo,
  question,
  position,
}: {
  demo: boolean;
  question?: StemForgeQuestion;
  position?: ReturnType<typeof getQuestionPosition>;
}) {
  const progress = position ? Math.round((position.current / position.total) * 100) : 0;

  return (
    <aside className="grid content-start gap-5">
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-extrabold">Your Progress</h2>
        <PanelProgress label="Topic Progress" value={demo ? progress : 0} valueLabel={demo ? `${progress}%` : "0%"} />
        <PanelProgress label="Session Progress" value={demo ? progress : 0} valueLabel={position ? `${position.current} / ${position.total} questions` : "0 / 0 questions"} />
        <PanelProgress label="Accuracy" value={demo ? 75 : 0} valueLabel={demo ? "75%" : "0%"} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-6 text-xl font-extrabold">Options</h2>
        <PanelOption icon={<BookOpen className="size-5" />} label="Formula Sheet" href="/resources" />
        <PanelOption icon={<Bookmark className="size-5" />} label={demo ? "Bookmarked" : "Bookmark"} active={demo} />
        <PanelOption icon={<Flag className="size-5" />} label="Report an issue" />
        <PanelOption icon={<PenLine className="size-5" />} label="Add a note" />
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Recommended Next</h2>
          <span className="grid size-8 place-items-center rounded-full bg-forge text-white">
            <ArrowRight className="size-5" />
          </span>
        </div>
        <p className="leading-relaxed text-muted">
          {demo
            ? `Continue ${question?.stage ?? "this stage"} in Motion - equations and graphs.`
            : "A recommendation will appear once progress exists."}
        </p>
        <Link href={position?.next ? `/question/${position.next.id}` : "/subjects/higher-physics/our-dynamic-universe/motion-equations-and-graphs"} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg border border-forge px-5 font-extrabold text-forge">
          {demo ? "Continue Questions" : "Start Practice"}
        </Link>
      </Card>
    </aside>
  );
}

function HeaderMeta({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}:</span>
      <strong className={badge ? "rounded-md bg-forge-soft px-2 py-1 text-forge" : ""}>{value}</strong>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-lg bg-forge-soft px-4 py-2 font-bold text-forge">{children}</span>;
}

function SolutionStep({
  number,
  title,
  equation,
  note,
}: {
  number: number;
  title: string;
  equation: ReactNode;
  note: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[34px_190px_minmax(220px,1fr)_220px] items-center gap-5 max-lg:grid-cols-[34px_1fr]">
      <span className="grid size-7 place-items-center rounded-full bg-[#229954] text-sm font-bold text-white">{number}</span>
      <strong>{title}</strong>
      <div className="rounded-lg border border-line bg-[#faf8f4] px-5 py-4 font-serif text-lg max-lg:col-span-2">{equation}</div>
      <p className="m-0 text-sm leading-relaxed text-muted max-lg:col-span-2">{note}</p>
    </div>
  );
}

function PanelProgress({ label, value, valueLabel }: { label: string; value: number; valueLabel: string }) {
  return (
    <div className="mb-7 last:mb-0">
      <div className="mb-3 flex justify-between gap-4">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function PanelOption({ icon, label, active, href }: { icon: ReactNode; label: string; active?: boolean; href?: string }) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        {icon}
        <span>{label}</span>
      </div>
      {active && <span className="h-6 w-11 rounded-full bg-forge p-1 after:block after:size-4 after:translate-x-5 after:rounded-full after:bg-white" />}
    </>
  );

  return href ? (
    <Link href={href} className="mb-5 flex items-center justify-between gap-4 rounded-lg last:mb-0">
      {content}
    </Link>
  ) : (
    <div className="mb-5 flex items-center justify-between gap-4 last:mb-0">{content}</div>
  );
}

function EmptyQuestionState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
      <Star className="mx-auto mb-4 size-9 text-forge" />
      <h2 className="text-2xl font-extrabold">No question loaded</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted">
        Once a course and topic are selected, the question, answer box, feedback and solution will appear here.
      </p>
    </div>
  );
}


