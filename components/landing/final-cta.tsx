import { getActiveSkillPathHref } from "@/lib/learning-paths";
import { ButtonLink } from "@/components/ui";

export function FinalCta() {
  return (
    <section className="grid justify-items-center gap-7 border-y border-line px-5 py-20 text-center">
      <h2 className="m-0 max-w-[820px] text-[clamp(44px,7vw,92px)] font-medium leading-[0.96]">
        Ready to Forge Your Potential?
      </h2>
      <ButtonLink href={getActiveSkillPathHref()} size="lg">
        Start Learning
      </ButtonLink>
    </section>
  );
}


