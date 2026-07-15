import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";

// Placeholder quotes — replace both with real student feedback before this page goes live.
const testimonials = [
  {
    quote: "[Add a real student quote here — what result did they get, and how did tuition help?]",
    name: "[Student name]",
    detail: "[Level, e.g. Higher Maths student]",
  },
  {
    quote: "[Add a second real student quote here.]",
    name: "[Student name]",
    detail: "[Level, e.g. National 5 Physics student]",
  },
] as const;

export function TuitionTestimonials() {
  return (
    <section className="mx-auto w-[min(1120px,calc(100%_-_40px))] py-20">
      <TuitionReveal className="text-center">
        <TuitionKicker>Student success</TuitionKicker>
      </TuitionReveal>
      <TuitionReveal delayMs={60}>
        <h2 className={`${lora.className} mx-auto mb-12 mt-5 max-w-[520px] text-center text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.15]`}>
          In their own words
        </h2>
      </TuitionReveal>
      <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
        {testimonials.map((testimonial, index) => (
          <TuitionReveal key={index} delayMs={index * 90} className="h-full">
            <figure className="relative m-0 h-full overflow-hidden rounded-[6px] border border-line bg-white p-7 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-card">
              <span className={`${lora.className} pointer-events-none absolute -left-1 -top-6 text-[110px] italic leading-none text-warning-soft`} aria-hidden="true">
                &ldquo;
              </span>
              <blockquote className="relative m-0 text-lg italic leading-[1.5] text-ink">
                <span className={lora.className}>&ldquo;{testimonial.quote}&rdquo;</span>
              </blockquote>
              <figcaption className="relative mt-4 text-sm font-extrabold text-muted">
                {testimonial.name}
                <span className="ml-2 font-normal text-muted">{testimonial.detail}</span>
              </figcaption>
            </figure>
          </TuitionReveal>
        ))}
      </div>
    </section>
  );
}
