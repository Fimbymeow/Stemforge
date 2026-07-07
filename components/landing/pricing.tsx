import type { ReactNode } from "react";
import { ButtonLink, Card } from "@/components/ui";

export function Pricing() {
  return (
    <section id="tuition" className="mx-auto w-[min(1220px,calc(100%_-_40px))] py-[68px]">
      <p className="mb-4 text-center font-mono text-[13px] font-extrabold uppercase">
        Simple access while the platform grows
      </p>
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <PricingCard
          label="Free"
          title="Start learning now"
          items={["Learning notes", "Question practice", "Worked solutions", "Progress tracking"]}
          action={<ButtonLink href="/subjects/higher-maths/calculus/differentiation/basic-differentiation">Start Learning</ButtonLink>}
        />
        <PricingCard
          label="Premium"
          title="Coming soon"
          items={["Full content", "More courses", "More practice paths", "Progress tools"]}
          action={
            <span className="inline-flex min-h-11 items-center rounded-md border border-ink px-6 text-sm font-extrabold uppercase">
              Coming Soon
            </span>
          }
          muted
        />
      </div>
    </section>
  );
}

function PricingCard({
  label,
  title,
  items,
  action,
  muted = false,
}: {
  label: string;
  title: string;
  items: string[];
  action: ReactNode;
  muted?: boolean;
}) {
  return (
    <Card className={`p-7 ${muted ? "bg-transparent shadow-none" : ""}`}>
      <p className="mb-4 font-mono text-[13px] font-extrabold uppercase text-forge">{label}</p>
      <h2 className="mb-6 text-[clamp(30px,4vw,52px)] font-extrabold leading-none">{title}</h2>
      <ul className="mb-7 grid gap-4 p-0 text-lg text-muted">
        {items.map((item) => (
          <li key={item} className="list-none before:mr-3 before:inline-block before:h-0.5 before:w-3 before:bg-forge before:align-middle">
            {item}
          </li>
        ))}
      </ul>
      {action}
    </Card>
  );
}


