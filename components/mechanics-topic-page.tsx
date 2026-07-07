// Legacy Higher Physics demo code. The active question engine is the Higher Maths QuestionWorkspace.
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  PenLine,
} from "lucide-react";
import { ButtonLink, Card, ProgressBar } from "@/components/ui";
import { dynamicUniverseSubtopics, higherPhysicsCourseAreas, learningStages } from "@/data/topics";
import { getFirstQuestionForStage } from "@/data/questions";
import { getHigherPhysicsCourseArea, getHigherPhysicsSpecArea, type HigherPhysicsCourseArea, type HigherPhysicsSpecArea } from "@/data/higher-physics";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";

type Subtopic = (typeof dynamicUniverseSubtopics)[number];
type SpecAreaCardData = HigherPhysicsSpecArea & {
  description?: string;
  progress?: number;
  completed?: number;
  questions?: number;
};
type LearningStage = (typeof learningStages)[number];

const stageIcons = {
  Foundations: BookOpen,
  Applications: PenLine,
  "Past Paper-style Questions": ClipboardList,
} as const;

const accentClasses = {
  green: {
    border: "border-[#229954]/45",
    bg: "bg-[#f1fbf4]",
    text: "text-[#188246]",
    button: "bg-[#188246] text-white",
    ring: "border-[#229954]",
    bar: "bg-[#229954]",
  },
  blue: {
    border: "border-[#2563eb]/40",
    bg: "bg-[#eef5ff]",
    text: "text-[#1d5fd8]",
    button: "bg-[#1d5fd8] text-white",
    ring: "border-[#2563eb]",
    bar: "bg-[#1d5fd8]",
  },
  orange: {
    border: "border-forge/45",
    bg: "bg-[#fff4ec]",
    text: "text-forge",
    button: "bg-forge text-white",
    ring: "border-forge",
    bar: "bg-forge",
  },
};

export function OurDynamicUniverseTopicPage() {
  const courseArea = getHigherPhysicsCourseArea("our-dynamic-universe") ?? higherPhysicsCourseAreas[0];
  const specAreas: SpecAreaCardData[] = "specAreas" in courseArea ? courseArea.specAreas : dynamicUniverseSubtopics;

  return (
    <AppShell demo active="Subjects">
        <Topbar />
        <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-7">
            <Breadcrumbs current={courseArea.name} />
            <UnitHero courseArea={courseArea} />
            <section>
              <h2 className="m-0 text-3xl font-extrabold">Spec Areas</h2>
              <p className="mt-2 text-muted">Choose a part of Our dynamic Universe to practise.</p>
              <div className="mt-6 grid grid-cols-2 gap-5 max-md:grid-cols-1">
                {specAreas.map((topic: SpecAreaCardData, index: number) => (
                  <SubtopicCard key={topic.slug} topic={topic} index={index} />
                ))}
              </div>
            </section>
          </section>
          <aside className="grid content-start gap-5">
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
              <p className="mb-2 text-sm font-bold uppercase text-muted">Continue</p>
              <h3 className="text-2xl font-extrabold">{specAreas[0].name}</h3>
              <div className="my-5">
                <div className="mb-2 flex justify-between font-bold">
                  <span>Progress</span>
                  <span>62%</span>
                </div>
                <ProgressBar value={62} />
              </div>
              <ButtonLink href="/subjects/higher-physics/our-dynamic-universe/motion-equations-and-graphs">
                Continue Area
              </ButtonLink>
            </Card>
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Unit Progress</h2>
              <SideStat label="Spec areas" value={String(specAreas.length)} />
              <SideStat label="Questions completed" value={String(courseArea.questionsCompleted)} />
              <SideStat label="Overall progress" value={`${courseArea.progress}%`} />
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-extrabold">How it works</h2>
              <p className="leading-relaxed text-muted">
                Pick one spec area, then work through Foundations, Applications and Past Paper-style Questions in order.
              </p>
            </Card>
          </aside>
        </div>
    </AppShell>
  );
}

export function DynamicUniverseSubtopicPage({ slug, courseAreaSlug = "our-dynamic-universe" }: { slug: string; courseAreaSlug?: string }) {
  const courseArea = getHigherPhysicsCourseArea(courseAreaSlug) ?? higherPhysicsCourseAreas[0];
  const subtopic = getHigherPhysicsSpecArea(courseAreaSlug, slug) ?? dynamicUniverseSubtopics[0];

  return (
    <AppShell demo active="Subjects">
        <Topbar />
        <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-7">
            <SubtopicBreadcrumbs courseArea={courseArea.name} current={subtopic.name} />
            <SubtopicHero subtopic={subtopic} />
            <section>
              <h2 className="m-0 text-3xl font-extrabold">Learning Path</h2>
              <p className="mt-2 text-muted">Work through the stages to master this spec area.</p>
              <div className="mt-7 grid gap-5">
                {learningStages.map((stage: LearningStage, index: number) => (
                  <LearningStageCard key={stage.name} stage={stage} index={index} />
                ))}
              </div>
            </section>
            <Card className="border-forge/30 bg-[#fff4ec] p-6">
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-forge text-forge">i</span>
                <div>
                  <h3 className="m-0 font-extrabold">We recommend completing each stage in order.</h3>
                  <p className="mt-2 text-muted">
                    Foundations build the basics, Applications build fluency, and Past Paper-style Questions get you ready for exam-style work.
                  </p>
                </div>
              </div>
            </Card>
          </section>
          <aside className="grid content-start gap-5">
            <RecommendationCard />
            <BreakdownCard />
            <WhyPathwayCard />
          </aside>
        </div>
    </AppShell>
  );
}

function Topbar() {
  return (
    <div className="mx-auto mb-6 flex max-w-[1240px] justify-end">
      <AppTopbar demo />
    </div>
  );
}

function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      <Link href="/subjects/demo">Subjects</Link>
      <ArrowRight className="size-4" />
      <Link href="/subjects/higher-physics">Higher Physics</Link>
      <ArrowRight className="size-4" />
      <span className="font-bold text-forge">{current}</span>
    </nav>
  );
}

function SubtopicBreadcrumbs({ courseArea, current }: { courseArea: string; current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      <Link href="/subjects/demo">Subjects</Link>
      <ArrowRight className="size-4" />
      <Link href="/subjects/higher-physics">Higher Physics</Link>
      <ArrowRight className="size-4" />
      <Link href="/subjects/higher-physics/our-dynamic-universe">{courseArea}</Link>
      <ArrowRight className="size-4" />
      <span className="font-bold text-forge">{current}</span>
    </nav>
  );
}

function UnitHero({ courseArea }: { courseArea: HigherPhysicsCourseArea }) {
  return (
    <Card className="overflow-hidden p-8">
      <div className="grid grid-cols-[auto_1fr] gap-7 max-md:grid-cols-1">
        <span className="grid size-20 place-items-center rounded-2xl bg-forge text-white">
          <GraduationCap className="size-10" />
        </span>
        <div>
          <h1 className="m-0 text-[clamp(42px,5vw,68px)] font-extrabold leading-none">{courseArea.name}</h1>
          <p className="mt-4 max-w-2xl text-xl leading-relaxed text-muted">
            {courseArea.description}
          </p>
          <div className="mt-7 grid max-w-2xl grid-cols-3 gap-4 max-md:grid-cols-1">
            <HeroStat label="Spec Areas" value={String(courseArea.specAreas.length)} />
            <HeroStat label="Questions Completed" value={String(courseArea.questionsCompleted)} />
            <HeroStat label="Unit Progress" value={`${courseArea.progress}%`} />
          </div>
          <ProgressBar value={courseArea.progress} className="mt-8 h-3" />
        </div>
      </div>
    </Card>
  );
}

function SubtopicHero({ subtopic }: { subtopic: SpecAreaCardData }) {
  return (
    <Card className="overflow-hidden p-8">
      <div className="grid grid-cols-[auto_1fr] gap-7 max-md:grid-cols-1">
        <span className="grid size-20 place-items-center rounded-2xl bg-forge text-white">
          <BookOpen className="size-10" />
        </span>
        <div>
          <h1 className="m-0 text-[clamp(38px,5vw,62px)] font-extrabold leading-none">{subtopic.name}</h1>
          <p className="mt-4 max-w-2xl text-xl leading-relaxed text-muted">
            {subtopic.description ?? "Structured practice for this Higher Physics spec area."}
          </p>
          <div className="mt-7 grid max-w-2xl grid-cols-3 gap-4 max-md:grid-cols-1">
            <HeroStat label="Questions" value={String(subtopic.questions ?? 0)} />
            <HeroStat label="Complete" value={`${subtopic.progress ?? 0}%`} />
            <HeroStat label="Questions Completed" value={String(subtopic.completed ?? 0)} />
          </div>
          <ProgressBar value={subtopic.progress ?? 0} className="mt-8 h-3" />
        </div>
      </div>
    </Card>
  );
}

function SubtopicCard({ topic, index }: { topic: SpecAreaCardData; index: number }) {
  return (
    <Link href={`/subjects/higher-physics/our-dynamic-universe/${topic.slug}`} className="group">
      <Card className="h-full p-6 transition group-hover:-translate-y-0.5 group-hover:border-forge/45">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff4ec] font-extrabold text-forge">
            {index + 1}
          </span>
          <ArrowRight className="size-5 text-muted transition group-hover:text-forge" />
        </div>
        <h3 className="m-0 text-2xl font-extrabold">{topic.name}</h3>
        <p className="mt-3 min-h-[76px] text-muted">
          {topic.description ?? "Structured practice for this Higher Physics spec area."}
        </p>
        <div className="mb-3 mt-5 flex justify-between text-sm font-bold">
          <span>{topic.questions ?? 0} Questions</span>
          <span>{topic.progress ?? 0}% Complete</span>
        </div>
        <ProgressBar value={topic.progress ?? 0} />
        <p className="mt-5 font-extrabold text-forge">Open spec area -&gt;</p>
      </Card>
    </Link>
  );
}

function LearningStageCard({
  stage,
  index,
}: {
  stage: LearningStage;
  index: number;
}) {
  const Icon = stageIcons[stage.name];
  const accent = accentClasses[stage.accent];
  const percent = Math.round((stage.completed / stage.questions) * 100);
  const legacyStage = stage.name === "Past Paper-style Questions" ? "Past Paper Questions" : stage.name;
  const firstQuestion = getFirstQuestionForStage(legacyStage as Parameters<typeof getFirstQuestionForStage>[0]);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-5 max-md:grid-cols-1">
      <div className="relative flex justify-center max-md:hidden">
        <span className={`z-10 grid size-10 place-items-center rounded-full border-2 bg-paper font-extrabold ${accent.ring} ${accent.text}`}>
          {index + 1}
        </span>
        {index < learningStages.length - 1 && <span className="absolute top-10 h-[calc(100%+20px)] border-l border-dashed border-line" />}
      </div>
      <Card className={`p-6 ${accent.border}`}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 max-md:grid-cols-1">
          <span className={`grid size-20 place-items-center rounded-2xl ${accent.bg} ${accent.text}`}>
            <Icon className="size-10" />
          </span>
          <div>
            <h3 className={`m-0 text-2xl font-extrabold ${accent.text}`}>{stage.name}</h3>
            <p className="mt-3 text-muted">{stage.description}</p>
            <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-muted">
              <span>{stage.questions} Questions</span>
              <span>
                {stage.completed} / {stage.questions} Complete
              </span>
            </div>
          </div>
          <div className="grid justify-items-end gap-4 max-md:justify-items-start">
            <ProgressCircle value={percent} />
            <Link href={firstQuestion ? `/question/${firstQuestion.id}` : "/question"} className={`inline-flex min-h-11 items-center rounded-lg px-5 font-extrabold ${accent.button}`}>
              {stage.button}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RecommendationCard() {
  const firstApplicationQuestion = getFirstQuestionForStage("Applications");

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
      <p className="mb-2 text-sm font-bold uppercase text-muted">Continue</p>
      <h3 className="text-3xl font-extrabold text-[#1d5fd8]">Applications</h3>
      <div className="my-5">
        <div className="mb-2 flex justify-between font-bold">
          <span>Your progress</span>
          <span>40%</span>
        </div>
        <ProgressBar value={40} />
      </div>
      <ButtonLink href={firstApplicationQuestion ? `/question/${firstApplicationQuestion.id}` : "/question"}>Continue</ButtonLink>
    </Card>
  );
}

function BreakdownCard() {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Practice Breakdown</h2>
      <BreakdownRow label="Foundations" value="0 / 5" progress={0} color="bg-[#229954]" />
      <BreakdownRow label="Applications" value="2 / 5" progress={40} color="bg-[#1d5fd8]" />
      <BreakdownRow label="Past Paper-style Questions" value="3 / 6" progress={50} color="bg-forge" />
      <div className="mt-7">
        <div className="mb-2 flex justify-between font-bold">
          <span>Overall Progress</span>
          <span>42%</span>
        </div>
        <ProgressBar value={42} />
      </div>
    </Card>
  );
}

function WhyPathwayCard() {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Why this pathway?</h2>
      <div className="mb-6 flex items-center gap-2">
        {learningStages.map((stage: LearningStage, index: number) => {
          const Icon = stageIcons[stage.name];
          const accent = accentClasses[stage.accent];
          return (
            <div key={stage.name} className="flex items-center gap-2">
              <span className={`grid size-11 place-items-center rounded-full ${accent.bg} ${accent.text}`}>
                <Icon className="size-5" />
              </span>
              {index < learningStages.length - 1 && <ArrowRight className="size-4 text-muted" />}
            </div>
          );
        })}
      </div>
      <p className="leading-relaxed text-muted">
        STEM Forge moves from Foundations to Applications and then Past Paper-style Questions, so students build confidence
        before taking on exam-style work.
      </p>
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-line bg-[#fffdf9] p-4 last:mb-0">
      <span className="text-muted">{label}</span>
      <strong className="text-xl">{value}</strong>
    </div>
  );
}

function ProgressCircle({ value }: { value: number }) {
  return (
    <div className="grid size-16 place-items-center rounded-full border-4 border-[#e8e1d8] bg-white font-extrabold text-sm text-ink">
      {value}%
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  progress,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  color: string;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-bold">
          <span className={`size-3 rounded-full ${color}`} />
          {label}
        </span>
        <strong>{value}</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eeeae3]">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}






