import { lora } from "@/components/tuition/tuition-fonts";
import { TuitionKicker } from "@/components/tuition/tuition-kicker";
import { TuitionReveal } from "@/components/tuition/tuition-reveal";
import { tuitionTestimonials } from "@/components/tuition/tuition-data";

export function TuitionTestimonials() {
  if (tuitionTestimonials.length === 0) return null;

  const featured = tuitionTestimonials.filter((testimonial) => testimonial.featured);
  const supporting = tuitionTestimonials.filter((testimonial) => !testimonial.featured);

  return (
    <section className="border-y border-line bg-white px-5 py-[clamp(64px,8vw,88px)]">
      <div className="mx-auto w-[min(1120px,100%)]">
      <TuitionReveal className="text-center">
        <TuitionKicker>Student and parent reviews</TuitionKicker>
      </TuitionReveal>
      <TuitionReveal delayMs={60}>
        <h2 className={`${lora.className} mx-auto mb-12 mt-4 max-w-[560px] text-center text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.15]`}>
          In their own words
        </h2>
      </TuitionReveal>
      <div className="grid grid-cols-2 border-y border-line max-md:grid-cols-1">
        {featured.map((testimonial, index) => (
          <TuitionReveal key={index} delayMs={index * 90} className="h-full">
            <figure className={`relative m-0 h-full py-9 ${index === 0 ? "border-r border-line pr-10 max-md:border-b max-md:border-r-0 max-md:pr-0" : "pl-10 max-md:pl-0"}`}>
              <blockquote className="m-0 text-[clamp(20px,2.2vw,27px)] italic leading-[1.45] text-ink">
                <span className={lora.className}>&ldquo;{testimonial.quote}&rdquo;</span>
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold text-muted">
                {testimonial.attribution}
              </figcaption>
            </figure>
          </TuitionReveal>
        ))}
      </div>
      <div className="grid grid-cols-3 max-md:grid-cols-1">
        {supporting.map((testimonial, index) => (
          <TuitionReveal key={testimonial.quote} delayMs={180 + index * 70}>
            <figure className={`m-0 py-8 ${index > 0 ? "border-l border-line pl-8 max-md:border-l-0 max-md:border-t max-md:pl-0" : "pr-8 max-md:pr-0"} ${index === 1 ? "pr-8" : ""}`}>
              <blockquote className={`${lora.className} m-0 text-lg italic leading-[1.55] text-ink`}>
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-muted">{testimonial.attribution}</figcaption>
            </figure>
          </TuitionReveal>
        ))}
      </div>
      </div>
    </section>
  );
}
