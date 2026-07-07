import Image from "next/image";
import { Card } from "@/components/ui";

const features = [
  {
    title: "Structured Learning Paths",
    image: "/assets/mockup-learning-paths.svg",
    alt: "Structured learning path preview",
    copy: "Know exactly what to study next with topic-by-topic progression across your courses.",
  },
  {
    title: "Worked Solutions",
    image: "/assets/mockup-worked-solutions.svg",
    alt: "Worked solution preview",
    copy: "Learn from mistakes, not just answers, with clear solutions after every question.",
  },
  {
    title: "Progress Tracking",
    image: "/assets/mockup-progress.svg",
    alt: "Progress tracking preview",
    copy: "See improvement over time and understand where your next study session should go.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-[min(1220px,calc(100%_-_40px))] py-[68px]">
      <p className="mb-4 text-center font-mono text-[13px] font-extrabold uppercase">
        Pick the skill that needs work. Build it with practice.
      </p>
      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        {features.map((feature) => (
          <Card key={feature.title} className="overflow-hidden rounded-xl">
            <div className="flex min-h-[68px] items-center justify-between border-b border-line px-6">
              <h2 className="m-0 text-[clamp(18px,2vw,22px)] font-extrabold uppercase leading-tight">
                {feature.title}
              </h2>
              <span className="text-3xl text-muted">+</span>
            </div>
            <div className="h-[230px] overflow-hidden border-b border-line bg-white">
              <Image
                src={feature.image}
                alt={feature.alt}
                width={760}
                height={420}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="m-0 min-h-28 p-7 text-lg leading-[1.35] text-muted before:mr-4 before:inline-block before:h-0.5 before:w-3.5 before:bg-forge before:align-middle">
              {feature.copy}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
