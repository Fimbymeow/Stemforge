import { TuitionContactForm } from "@/components/landing/tuition-contact-form";
import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

export function TuitionCta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-forge px-5 py-16">
      <div className="mx-auto max-w-[760px]">
        <TuitionReveal>
          <p className="m-0 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-warning-soft">Free first session</p>
          <p className={`${lora.className} m-0 mt-3 text-center text-[clamp(28px,3.4vw,36px)] font-bold text-white`}>
            Ready to get started?
          </p>
          <p className="mx-auto mt-3 max-w-[520px] text-center text-base leading-relaxed text-white/80">
            Your first session is free — send a few details below and you&apos;ll get a reply directly, or email
            us straight away.
          </p>
        </TuitionReveal>
        <TuitionReveal delayMs={100} className="mt-7">
          <TuitionContactForm />
        </TuitionReveal>
      </div>
    </section>
  );
}
