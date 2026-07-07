import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, GraduationCap, Layers3, Lock, PenLine } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ButtonLink, Card, ProgressBar } from "@/components/ui";
import { LockedCard } from "@/components/locked-card";
import { PracticeSetsSection } from "@/components/learning/practice-sets-section";
import { LocalLearningPathSection } from "@/components/learning/local-learning-path-section";
import { QuickRevisionResources } from "@/components/learning/quick-revision-resources";
import { LocalProgressControls, LocalRecommendedNextAction, LocalSkillPathProgressOverview } from "@/components/learning/local-skill-path-progress";
import { getFirstMathsQuestionForStage } from "@/data/question-registry";
import { getFirstQuestionForStage, type QuestionStage } from "@/data/questions";
import { getCourseArea, getLearningStages, getSpecArea, getSubject } from "@/data/subjects-registry";
import type { CourseArea, LearningStage, SkillPath, SpecArea, Subject } from "@/data/types";

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
    bar: "bg-[#188246]",
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

export function SubjectCoursePage({ subjectSlug }: { subjectSlug: string }) {
  const subject = getSubject(subjectSlug);
  if (!subject) return null;
  if (!subject.isAvailable) return <LockedSubjectPage subject={subject} />;

  return (
    <AppShell demo active="Subjects">
      <Topbar />
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-6">
          <Breadcrumbs items={["Subjects", subject.subjectName]} />
          <SubjectHero subject={subject} />
          <section>
            <div className="mb-5">
              <h2 className="m-0 text-3xl font-extrabold">Course Areas</h2>
              <p className="mt-2 text-muted">Work through {subject.subjectName} one area at a time.</p>
            </div>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
              {subject.courseAreas.map((area) => (
                <CourseAreaCard key={area.slug} area={area} />
              ))}
            </div>
          </section>
        </section>
        <aside className="grid content-start gap-5">
          <RecommendedCourseArea subject={subject} />
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Course Progress</h2>
            <SideStat label="Areas started" value={subject.progress > 0 ? "1" : "0"} />
            <SideStat label="Questions completed" value={String(subject.questionsCompleted)} />
            <SideStat label="Available areas" value={String(subject.courseAreas.filter((area) => area.available).length)} />
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

export function CourseAreaPage({ subjectSlug, courseAreaSlug }: { subjectSlug: string; courseAreaSlug: string }) {
  const subject = getSubject(subjectSlug);
  const courseArea = getCourseArea(subjectSlug, courseAreaSlug);
  if (!subject || !courseArea) return null;
  if (!subject.isAvailable) return <LockedSubjectPage subject={subject} />;

  return (
    <AppShell demo active="Subjects">
      <Topbar />
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-7">
          <Breadcrumbs items={["Subjects", subject.subjectName, courseArea.name]} />
          <CourseAreaHero courseArea={courseArea} />
          <section>
            <h2 className="m-0 text-3xl font-extrabold">Spec Areas</h2>
            <p className="mt-2 text-muted">Choose a spec area to practise.</p>
            <div className="mt-6 grid grid-cols-2 gap-5 max-md:grid-cols-1">
              {courseArea.specAreas.map((specArea, index) => (
                <SpecAreaCard key={specArea.slug} specArea={specArea} index={index} />
              ))}
            </div>
          </section>
        </section>
        <aside className="grid content-start gap-5">
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
            <p className="mb-2 text-sm font-bold uppercase text-muted">Continue</p>
            <h3 className="text-2xl font-extrabold">{courseArea.specAreas[0]?.name}</h3>
            <div className="my-5">
              <div className="mb-2 flex justify-between font-bold">
                <span>Progress</span>
                <span>{courseArea.specAreas[0]?.progress ?? 0}%</span>
              </div>
              <ProgressBar value={courseArea.specAreas[0]?.progress ?? 0} />
            </div>
            {courseArea.specAreas[0] && <ButtonLink href={courseArea.specAreas[0].href}>Open Spec Area</ButtonLink>}
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Area Progress</h2>
            <SideStat label="Spec areas" value={String(courseArea.specAreas.length)} />
            <SideStat label="Questions completed" value={String(courseArea.questionsCompleted)} />
            <SideStat label="Overall progress" value={`${courseArea.progress}%`} />
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

export function SpecAreaLearningPathPage({
  subjectSlug,
  courseAreaSlug,
  specAreaSlug,
}: {
  subjectSlug: string;
  courseAreaSlug: string;
  specAreaSlug: string;
}) {
  const subject = getSubject(subjectSlug);
  const courseArea = getCourseArea(subjectSlug, courseAreaSlug);
  const specArea = getSpecArea(subjectSlug, courseAreaSlug, specAreaSlug);
  const learningStages = getLearningStages(subjectSlug);
  if (!subject || !courseArea || !specArea) return null;
  if (!subject.isAvailable) return <LockedSubjectPage subject={subject} />;

  if (specArea.skillPaths?.length) {
    const availablePath = specArea.skillPaths.find((path) => path.isAvailable) ?? specArea.skillPaths[0];

    return (
      <AppShell demo active="Subjects">
        <Topbar />
        <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-7">
            <Breadcrumbs items={["Subjects", subject.subjectName, courseArea.name, specArea.name]} />
            <SpecAreaHubHero subject={subject} courseArea={courseArea} specArea={specArea} />
            <section>
              <h2 className="m-0 text-3xl font-extrabold">Skill Paths</h2>
              <p className="mt-2 text-muted">Differentiation is split into focused paths. Start with Basic differentiation.</p>
              <div className="mt-7 grid grid-cols-2 gap-5 max-md:grid-cols-1">
                {specArea.skillPaths.map((path) => (
                  <SkillPathCard key={path.slug} path={path} />
                ))}
              </div>
            </section>
          </section>
          <aside className="grid content-start gap-5">
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
              <p className="mb-2 text-sm font-bold uppercase text-muted">Start</p>
              <h3 className="text-3xl font-extrabold">{availablePath.name}</h3>
              <p className="mt-3 leading-relaxed text-muted">This is the active proof-of-concept path for Higher Maths.</p>
              <div className="my-5">
                <div className="mb-2 flex justify-between font-bold">
                  <span>Progress</span>
                  <span>{availablePath.progress}%</span>
                </div>
                <ProgressBar value={availablePath.progress} />
              </div>
              <ButtonLink href={availablePath.href}>Open Path</ButtonLink>
            </Card>
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Topic Progress</h2>
              <SideStat label="Available paths" value={String(specArea.skillPaths.filter((path) => path.isAvailable).length)} />
              <SideStat label="Locked paths" value={String(specArea.skillPaths.filter((path) => !path.isAvailable).length)} />
              <SideStat label="Questions ready" value={String(specArea.questions)} />
            </Card>
          </aside>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell demo active="Subjects">
      <Topbar />
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-7">
          <Breadcrumbs items={["Subjects", subject.subjectName, courseArea.name, specArea.name]} />
          <SpecAreaHero subject={subject} courseArea={courseArea} specArea={specArea} />
          <section>
            <h2 className="m-0 text-3xl font-extrabold">Learning Path</h2>
            <p className="mt-2 text-muted">Move from fluency to application, then into original exam-style questions.</p>
            <div className="mt-7 grid gap-5">
              {learningStages.map((stage, index) => (
                <LearningStageCard key={stage.name} stage={stage} index={index} subjectSlug={subjectSlug} />
              ))}
            </div>
          </section>
        </section>
        <aside className="grid content-start gap-5">
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
            <p className="mb-2 text-sm font-bold uppercase text-muted">Start</p>
            <h3 className="text-3xl font-extrabold text-[#188246]">Foundations</h3>
            <p className="mt-3 leading-relaxed text-muted">Begin with the core rules before moving into gradients and exam-style questions.</p>
            <div className="my-5">
              <div className="mb-2 flex justify-between font-bold">
                <span>{specArea.name}</span>
                <span>{specArea.progress}%</span>
              </div>
              <ProgressBar value={specArea.progress} />
            </div>
            <ButtonLink href={getStageQuestionHref(subjectSlug, "Foundations")}>Start</ButtonLink>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Stage Breakdown</h2>
            <div className="grid gap-4">
              {learningStages.map((stage) => (
                <StageBreakdownRow key={stage.name} stage={stage} />
              ))}
            </div>
          </Card>
          <Card className="bg-[#fffaf5] p-6">
            <h2 className="mb-4 text-xl font-extrabold">Why this order?</h2>
            <p className="leading-relaxed text-muted">
              STEM Forge keeps each topic structured: learn the rule, apply it to standard problems, then practise exam-style questions.
            </p>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}


export function SkillPathLearningPage({
  subjectSlug,
  courseAreaSlug,
  specAreaSlug,
  skillPathSlug,
}: {
  subjectSlug: string;
  courseAreaSlug: string;
  specAreaSlug: string;
  skillPathSlug: string;
}) {
  const subject = getSubject(subjectSlug);
  const courseArea = getCourseArea(subjectSlug, courseAreaSlug);
  const specArea = getSpecArea(subjectSlug, courseAreaSlug, specAreaSlug);
  const skillPath = specArea?.skillPaths?.find((path) => path.slug === skillPathSlug);
  const subjectLearningStages = getLearningStages(subjectSlug);
  if (!subject || !courseArea || !specArea || !skillPath) return null;
  if (!subject.isAvailable) return <LockedSubjectPage subject={subject} />;

  const learningStages = skillPath.learningStages ?? subjectLearningStages;
  const recommendedAction = skillPath.recommendedAction ?? {
    title: learningStages[0]?.name ?? "Start",
    copy: skillPath.description,
    href: learningStages[0]?.href ?? getStageQuestionHref(subjectSlug, learningStages[0]?.name ?? "Foundations"),
    label: learningStages[0]?.button ?? "Start",
  };
  const currentPathLabel = skillPath.currentPathLabel ?? `${subject.subjectName} / ${courseArea.name} / ${specArea.name} / ${skillPath.name}`;
  const sidebarLinks = skillPath.sidebarLinks ?? [
    { label: specArea.name, href: specArea.href },
    { label: "First question", href: recommendedAction.href },
    { label: "Subjects", href: "/subjects" },
  ];

  return (
    <AppShell demo active="Subjects">
      <Topbar />
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-7">
          <Breadcrumbs items={["Subjects", subject.subjectName, courseArea.name, specArea.name, skillPath.name]} />
          <SkillPathHero subject={subject} courseArea={courseArea} specArea={specArea} skillPath={skillPath} />
          <LocalRecommendedNextAction skillPath={skillPath} />
          <LocalSkillPathProgressOverview skillPath={skillPath} />
          <div className="grid gap-7">
            <LocalLearningPathSection skillPath={skillPath} />
            <QuickRevisionResources
              notes={skillPath.notes}
              formulaCards={skillPath.formulaCards}
              workedExamples={skillPath.workedExamples}
              flashcards={skillPath.flashcards}
            />
            <PracticeSetsSection practiceSets={skillPath.practiceSets} />
            <LocalProgressControls skillPath={skillPath} />
          </div>
        </section>
        <aside className="grid content-start gap-5">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-extrabold">Current Path</h2>
            <p className="text-muted">{currentPathLabel}</p>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-extrabold">Quick Links</h2>
            <div className="grid gap-3">
              {sidebarLinks.map((link) => (
                <SideLink key={`${link.label}-${link.href}`} href={link.href}>{link.label}</SideLink>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
function LockedSubjectPage({ subject }: { subject: Subject }) {
  return (
    <AppShell demo active="Subjects">
      <Topbar />
      <div className="mx-auto grid max-w-[920px] gap-6">
        <Breadcrumbs items={["Subjects", subject.subjectName]} />
        <LockedCard
          title={`${subject.subjectName} is coming soon`}
          description="Structured SQA Higher Physics learning paths are being prepared. Higher Maths Basic differentiation is the active STEM Forge proof of concept for now."
          badge="Coming Soon"
        />
        <Card className="p-7">
          <h2 className="mb-3 text-2xl font-extrabold">Continue with Higher Maths</h2>
          <p className="mb-6 max-w-2xl leading-relaxed text-muted">
            Try the current vertical slice: Learn, practise, answer questions and review worked solutions in Basic differentiation.
          </p>
          <ButtonLink href="/subjects/higher-maths/calculus/differentiation/basic-differentiation">
            Open Basic differentiation
          </ButtonLink>
        </Card>
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

function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? "font-bold text-forge" : ""}>{item}</span>
          {index < items.length - 1 && <ArrowRight className="size-4" />}
        </span>
      ))}
    </nav>
  );
}

function SubjectHero({ subject }: { subject: Subject }) {
  return (
    <Card className="p-8">
      <div className="grid grid-cols-[1fr_auto] gap-8 max-md:grid-cols-1">
        <div>
          <span className="inline-flex rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">
            {subject.isAvailable ? "Available Now" : "Coming Soon"}
          </span>
          <h1 className="mb-4 mt-5 text-[clamp(38px,5vw,64px)] font-extrabold leading-none">{subject.subjectName}</h1>
          <p className="max-w-2xl text-xl leading-relaxed text-muted">{subject.longDescription}</p>
        </div>
        <div className="grid min-w-[220px] content-center rounded-2xl border border-line bg-[#fffaf5] p-6 text-center">
          <GraduationCap className="mx-auto mb-4 size-12 text-forge" />
          <strong className="text-4xl">{subject.progress}%</strong>
          <span className="mt-2 text-muted">Course progress</span>
          <span className="mt-4 border-t border-line pt-4 text-sm font-bold text-muted">
            {subject.questionsCompleted} Questions Completed
          </span>
        </div>
      </div>
    </Card>
  );
}

function CourseAreaHero({ courseArea }: { courseArea: CourseArea }) {
  return (
    <Card className="overflow-hidden p-8">
      <h1 className="m-0 text-[clamp(42px,5vw,68px)] font-extrabold leading-none">{courseArea.name}</h1>
      <p className="mt-4 max-w-2xl text-xl leading-relaxed text-muted">{courseArea.description}</p>
      <div className="mt-7 grid max-w-2xl grid-cols-3 gap-4 max-md:grid-cols-1">
        <HeroStat label="Spec Areas" value={String(courseArea.specAreas.length)} />
        <HeroStat label="Questions Completed" value={String(courseArea.questionsCompleted)} />
        <HeroStat label="Area Progress" value={`${courseArea.progress}%`} />
      </div>
      <ProgressBar value={courseArea.progress} className="mt-8 h-3" />
    </Card>
  );
}


function SpecAreaHubHero({ subject, courseArea, specArea }: { subject: Subject; courseArea: CourseArea; specArea: SpecArea }) {
  const availableCount = specArea.skillPaths?.filter((path) => path.isAvailable).length ?? 0;
  const lockedCount = specArea.skillPaths?.filter((path) => !path.isAvailable).length ?? 0;

  return (
    <Card className="overflow-hidden p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">{subject.subjectName}</span>
        <span className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-muted">{courseArea.name}</span>
      </div>
      <h1 className="m-0 text-[clamp(42px,5vw,68px)] font-extrabold leading-none">{specArea.name}</h1>
      <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted">
        Choose a focused skill path. Basic differentiation is available now; the remaining paths are being prepared.
      </p>
      <div className="mt-7 grid max-w-3xl grid-cols-3 gap-4 max-md:grid-cols-1">
        <HeroStat label="Available Now" value={String(availableCount)} />
        <HeroStat label="Coming Soon" value={String(lockedCount)} />
        <HeroStat label="Questions Ready" value={String(specArea.questions)} />
      </div>
    </Card>
  );
}

function SkillPathHero({ subject, courseArea, specArea, skillPath }: { subject: Subject; courseArea: CourseArea; specArea: SpecArea; skillPath: SkillPath }) {
  return (
    <Card className="overflow-hidden p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">{subject.subjectName}</span>
        <span className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-muted">{courseArea.name}</span>
        <span className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-muted">{specArea.name}</span>
      </div>
      <h1 className="m-0 text-[clamp(42px,5vw,68px)] font-extrabold leading-none">{skillPath.name}</h1>
      <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted">{skillPath.description}</p>
      <p className="mt-4 text-sm font-bold text-muted">Original SQA-style practice - Progress saved on this browser</p>
      <div className="mt-7 grid max-w-3xl grid-cols-3 gap-4 max-md:grid-cols-1">
        <HeroStat label="Questions" value={String(skillPath.questions)} />
        <HeroStat label="Mastery" value="Not started" />
        <HeroStat label="Structure" value="Learn + Practice" />
      </div>
      <ProgressBar value={skillPath.progress} className="mt-8 h-3" />
    </Card>
  );
}

function SkillPathCard({ path }: { path: SkillPath }) {
  const content = (
    <Card className={`h-full p-6 transition ${path.isAvailable ? "border-forge/40 bg-gradient-to-br from-forge/10 to-white hover:-translate-y-0.5" : "bg-white opacity-70"}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
          {path.isAvailable ? <Layers3 className="size-6" /> : <Lock className="size-5" />}
        </span>
        <span className={`rounded-lg px-3 py-1 text-xs font-extrabold ${path.isAvailable ? "bg-[#fff4ec] text-forge" : "bg-[#f4f1eb] text-muted"}`}>
          {path.isAvailable ? "Available Now" : "Coming Soon"}
        </span>
      </div>
      <h3 className="mb-3 text-2xl font-extrabold">{path.name}</h3>
      <p className="min-h-[74px] text-muted">{path.description}</p>
      <div className="mb-3 mt-5 flex justify-between text-sm font-bold">
        <span>{path.questions} Questions</span>
        <span>{path.progress}% Complete</span>
      </div>
      <ProgressBar value={path.progress} />
      <p className="mt-5 font-extrabold text-forge">{path.isAvailable ? "Open path ->" : "Locked for now"}</p>
    </Card>
  );

  return path.isAvailable ? <Link href={path.href}>{content}</Link> : content;
}


function SpecAreaHero({ subject, courseArea, specArea }: { subject: Subject; courseArea: CourseArea; specArea: SpecArea }) {
  return (
    <Card className="overflow-hidden p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">{subject.subjectName}</span>
        <span className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-muted">{courseArea.name}</span>
      </div>
      <h1 className="m-0 text-[clamp(42px,5vw,68px)] font-extrabold leading-none">{specArea.name}</h1>
      <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted">{specArea.description}</p>
      <div className="mt-7 grid max-w-2xl grid-cols-3 gap-4 max-md:grid-cols-1">
        <HeroStat label="Questions" value={String(specArea.questions)} />
        <HeroStat label="Complete" value={`${specArea.progress}%`} />
        <HeroStat label="Pathway" value="3 Stages" />
      </div>
      <ProgressBar value={specArea.progress} className="mt-8 h-3" />
    </Card>
  );
}

function CourseAreaCard({ area }: { area: CourseArea }) {
  const content = (
    <Card className={`h-full p-6 transition ${area.available ? "border-forge/40 bg-gradient-to-br from-forge/10 to-white hover:-translate-y-0.5" : "bg-white opacity-70"}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-2xl font-extrabold">{area.name}</h3>
          <p className="mt-3 min-h-[72px] text-muted">{area.description}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff4ec] text-forge">
          <ArrowRight className="size-5" />
        </span>
      </div>
      <div className="mb-3 flex justify-between text-sm font-bold">
        <span>{area.specAreas.length} Spec Areas</span>
        <span>{area.progress}% Complete</span>
      </div>
      <ProgressBar value={area.progress} />
      <p className="mt-5 font-extrabold text-forge">{area.available ? "Continue ->" : "Coming soon"}</p>
    </Card>
  );

  return area.available ? <Link href={area.href}>{content}</Link> : content;
}

function SpecAreaCard({ specArea, index }: { specArea: SpecArea; index: number }) {
  return (
    <Link href={specArea.href} className="group">
      <Card className="h-full p-6 transition group-hover:-translate-y-0.5 group-hover:border-forge/45">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff4ec] font-extrabold text-forge">
            {index + 1}
          </span>
          <ArrowRight className="size-5 text-muted transition group-hover:text-forge" />
        </div>
        <h3 className="m-0 text-2xl font-extrabold">{specArea.name}</h3>
        <p className="mt-3 min-h-[76px] text-muted">{specArea.description}</p>
        <div className="mb-3 mt-5 flex justify-between text-sm font-bold">
          <span>{specArea.questions} Questions</span>
          <span>{specArea.progress}% Complete</span>
        </div>
        <ProgressBar value={specArea.progress} />
        <p className="mt-5 font-extrabold text-forge">Open spec area -&gt;</p>
      </Card>
    </Link>
  );
}

function LearningStageCard({ stage, index, subjectSlug }: { stage: LearningStage; index: number; subjectSlug: string }) {
  const Icon = stageIcons[stage.name];
  const accent = accentClasses[stage.accent];
  const percent = stage.questions ? Math.round((stage.completed / stage.questions) * 100) : 0;
  const href = stage.href ?? getStageQuestionHref(subjectSlug, stage.name);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-5 max-md:grid-cols-1">
      <div className="relative flex justify-center max-md:hidden">
        {index < 2 && <span className="absolute top-10 h-[calc(100%+20px)] w-px bg-line" />}
        <span className={`z-10 grid size-10 place-items-center rounded-full border-2 bg-paper font-extrabold ${accent.ring} ${accent.text}`}>
          {index + 1}
        </span>
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
              <span>{stage.completed} / {stage.questions} Complete</span>
            </div>
          </div>
          <div className="grid justify-items-end gap-4 max-md:justify-items-start">
            <div className="relative grid size-16 place-items-center rounded-full border-4 border-[#e8e1d8] bg-white font-extrabold text-sm text-ink">
              {percent}%
            </div>
            <Link href={href} className={`inline-flex min-h-11 items-center rounded-lg px-5 font-extrabold ${accent.button}`}>
              {stage.button}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StageBreakdownRow({ stage }: { stage: LearningStage }) {
  const accent = accentClasses[stage.accent];
  const percent = stage.questions ? Math.round((stage.completed / stage.questions) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-bold">
          <CheckCircle2 className={`size-4 ${accent.text}`} />
          {stage.name}
        </span>
        <span className="text-sm font-bold text-muted">
          {stage.completed} / {stage.questions}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eeeae3]">
        <span className={`block h-full rounded-full ${accent.bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RecommendedCourseArea({ subject }: { subject: Subject }) {
  const firstArea = subject.courseAreas.find((area) => area.available) ?? subject.courseAreas[0];
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
      <p className="mb-2 text-sm font-bold uppercase text-muted">Continue</p>
      <h3 className="text-2xl font-extrabold">{firstArea.name}</h3>
      <div className="my-5">
        <div className="mb-2 flex justify-between font-bold">
          <span>Progress</span>
          <span>{firstArea.progress}%</span>
        </div>
        <ProgressBar value={firstArea.progress} />
      </div>
      {firstArea.available ? <ButtonLink href={firstArea.href}>Continue Area</ButtonLink> : <p className="text-muted">Coming soon</p>}
    </Card>
  );
}

function getStageQuestionHref(subjectSlug: string, stage: string) {
  if (subjectSlug === "higher-maths") {
    const question = getFirstMathsQuestionForStage(stage);
    return question ? `/question/${question.id}` : "/question";
  }

  const question = getFirstQuestionForStage(stage as QuestionStage);
  return question ? `/question/${question.id}` : "/question";
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

function SideLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-[#fffdf9] px-4 font-bold transition hover:border-forge/45">
      <span>{children}</span>
      <ArrowRight className="size-4 text-forge" />
    </Link>
  );
}
export const SubjectPageTemplate = SubjectCoursePage;
export const CourseAreaPageTemplate = CourseAreaPage;
export const TopicHubTemplate = SpecAreaLearningPathPage;
export const SkillPathPageTemplate = SkillPathLearningPage;
















