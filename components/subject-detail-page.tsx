// Legacy Higher Physics demo code. The active question engine is the Higher Maths QuestionWorkspace.
import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import { ButtonLink, Card, ProgressBar } from "@/components/ui";
import { higherPhysicsSubject } from "@/data/subjects";
import { higherPhysicsCourseAreas } from "@/data/topics";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";

export function SubjectDetailPage() {
  return (
    <AppShell demo active="Subjects">
        <Topbar />
        <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-6">
            <Breadcrumbs />
            <HeroCard />
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="m-0 text-3xl font-extrabold">Course Areas</h2>
                  <p className="mt-2 text-muted">Work through Higher Physics one area at a time.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                {higherPhysicsCourseAreas.map((topic) => (
                  <TopicCard key={topic.name} topic={topic} />
                ))}
              </div>
            </section>
          </section>
          <aside className="grid content-start gap-5">
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
              <p className="mb-2 text-sm font-bold uppercase text-muted">Continue</p>
              <h3 className="text-2xl font-extrabold">{higherPhysicsCourseAreas[0].name}</h3>
              <div className="my-5">
                <div className="mb-2 flex justify-between font-bold">
                  <span>Progress</span>
                  <span>{higherPhysicsCourseAreas[0].progress}%</span>
                </div>
                <ProgressBar value={higherPhysicsCourseAreas[0].progress} />
              </div>
              <ButtonLink href={higherPhysicsCourseAreas[0].href}>Continue Area</ButtonLink>
            </Card>
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Course Progress</h2>
              <SideStat label="Topics started" value="4" />
              <SideStat label="Questions completed" value={String(higherPhysicsSubject.questionsCompleted)} />
              <SideStat label="Accuracy" value="75%" />
            </Card>
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-extrabold">Recent Activity</h2>
              <div className="grid gap-3">
                <ActivityRow title="Motion - equations and graphs" meta="Continued today" />
                <ActivityRow title="Forces, energy and power" meta="Practised 2 days ago" />
                <ActivityRow title="Collisions and impulse" meta="Started this week" />
              </div>
            </Card>
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

function Breadcrumbs() {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      <Link href="/subjects/demo">Subjects</Link>
      <ArrowRight className="size-4" />
      <span className="font-bold text-forge">Higher Physics</span>
    </nav>
  );
}

function HeroCard() {
  return (
    <Card className="p-8">
      <div className="grid grid-cols-[1fr_auto] gap-8 max-md:grid-cols-1">
        <div>
          <span className="inline-flex rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">
            Available Now
          </span>
          <h1 className="mb-4 mt-5 text-[clamp(38px,5vw,64px)] font-extrabold leading-none">{higherPhysicsSubject.name}</h1>
          <p className="max-w-2xl text-xl leading-relaxed text-muted">
            {higherPhysicsSubject.longDescription}
          </p>
        </div>
        <div className="grid min-w-[220px] content-center rounded-2xl border border-line bg-[#fffaf5] p-6 text-center">
          <Orbit className="mx-auto mb-4 size-12 text-forge" />
          <strong className="text-4xl">{higherPhysicsSubject.progress}%</strong>
          <span className="mt-2 text-muted">Course progress</span>
          <span className="mt-4 border-t border-line pt-4 text-sm font-bold text-muted">
            {higherPhysicsSubject.questionsCompleted} Questions Completed
          </span>
        </div>
      </div>
    </Card>
  );
}

function TopicCard({ topic }: { topic: (typeof higherPhysicsCourseAreas)[number] }) {
  const body = (
    <Card
      className={`h-full p-6 transition ${
        topic.available ? "border-forge/40 bg-gradient-to-br from-forge/10 to-white hover:-translate-y-0.5" : "bg-white"
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-2xl font-extrabold">{topic.name}</h3>
          <p className="mt-3 min-h-[72px] text-muted">{topic.description}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff4ec] text-forge">
          <ArrowRight className="size-5" />
        </span>
      </div>
      <div className="mb-3 flex justify-between text-sm font-bold">
        <span>{topic.specAreaCount} Spec Areas</span>
        <span>{topic.progress}% Complete</span>
      </div>
      <ProgressBar value={topic.progress} />
      <p className="mt-5 font-extrabold text-forge">{topic.available ? "Continue" : "Coming soon"} →</p>
    </Card>
  );

  return topic.available ? <Link href={topic.href}>{body}</Link> : body;
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-line bg-[#fffdf9] p-4 last:mb-0">
      <span className="text-muted">{label}</span>
      <strong className="text-xl">{value}</strong>
    </div>
  );
}

function ActivityRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-xl border border-line bg-[#fffdf9] p-4">
      <p className="m-0 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{meta}</p>
    </div>
  );
}



