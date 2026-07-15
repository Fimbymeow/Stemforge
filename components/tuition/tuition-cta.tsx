import { TuitionContactForm } from "@/components/landing/tuition-contact-form";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

export function TuitionCta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-forge px-5 py-20">
      <div className="mx-auto max-w-[900px]">
        <TuitionReveal>
          <p className="m-0 text-center text-[12.5px] font-extrabold uppercase tracking-wide text-warning-soft">Get started</p>
          <p className={`${lora.className} m-0 mt-3 text-center text-[clamp(26px,3.4vw,36px)] font-bold text-white`}>
            Ready to elevate your results?
          </p>
          <p className="mx-auto mt-3 max-w-[520px] text-center text-base leading-relaxed text-white/80">
            Send a few details below and you&apos;ll get a reply directly, or email us straight away.
          </p>
        </TuitionReveal>
        <TuitionReveal delayMs={100} className="mt-9">
          <TuitionContactForm />
        </TuitionReveal>
      </div>
    </section>
  );
}
