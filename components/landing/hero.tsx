import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Image from "next/image";
import { ButtonLink } from "@/components/ui";

export function Hero() {
  return (
    <section className="border-b border-line px-5 py-[clamp(72px,8vw,118px)]">
      <div className="mx-auto grid w-[min(1220px,100%)] grid-cols-[minmax(340px,500px)_minmax(520px,1.25fr)] items-center gap-[clamp(42px,5vw,76px)] max-lg:grid-cols-1 max-lg:text-center">
        <div className="max-w-[500px] max-lg:mx-auto">
          <h1 className="m-0 max-w-[520px] text-[clamp(50px,5.2vw,78px)] font-[780] leading-[1.04]">
            Forge Your Potential<span className="text-forge">.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[clamp(18px,2vw,23px)] leading-[1.42] text-muted">
            A structured Qualifications Scotland STEM learning platform. Start with Higher
            Maths Basic differentiation, including guided practice and worked solutions.
          </p>
          <div className="mt-9 flex flex-wrap gap-4 max-lg:justify-center">
            <ButtonLink href={getActiveSkillPathHref()} size="lg">
              Start Learning
            </ButtonLink>
            <ButtonLink href="#features" variant="secondary" size="lg">
              Explore Features
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm font-semibold text-muted">
            No account needed. Progress is saved locally on this browser.
          </p>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-hero">
          <Image
            src="/assets/mockup-dashboard.svg"
            alt="STEM Forge dashboard preview"
            width={1180}
            height={580}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}




