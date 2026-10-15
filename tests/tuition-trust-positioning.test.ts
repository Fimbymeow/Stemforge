import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { tuitionLevels, tuitionTestimonials } from "../components/tuition/tuition-data";

const source = (file: string) => readFileSync(file, "utf8");

const TUITION_FILES = [
  "app/tuition/page.tsx",
  "app/tuition/about/page.tsx",
  "app/tuition/pricing/page.tsx",
  "components/tuition/tuition-hero.tsx",
  "components/tuition/tuition-intro.tsx",
  "components/tuition/tuition-about.tsx",
  "components/tuition/tuition-difference.tsx",
  "components/tuition/tuition-testimonials.tsx",
  "components/tuition/tuition-data.ts",
  "components/tuition/tuition-cta.tsx",
  "components/tuition/tuition-pricing.tsx",
  "components/tuition/tuition-navbar.tsx",
  "components/tuition/tuition-footer.tsx",
  "components/landing/tuition-contact-form.tsx",
];

test("Finlay's verified credential text (name, tutoring experience, five Higher A's and current study) appears on the Tuition homepage", () => {
  const hero = source("components/tuition/tuition-hero.tsx");
  const intro = source("components/tuition/tuition-intro.tsx");
  const combined = hero + intro;
  assert.match(combined, /Finlay Kennedy/);
  assert.match(combined, /2\+ years of tutoring experience/);
  assert.match(combined, /five Highers|A grades/i);
  assert.match(combined, /Advanced Higher Mathematics, Physics, Chemistry and Mathematics of Mechanics/);
});

test("the About page states all five real Higher subjects as A grades, not a fabricated count", () => {
  const about = source("components/tuition/tuition-about.tsx");
  for (const subject of ["Mathematics", "Physics", "Chemistry", "Biology", "English"]) {
    assert.match(about, new RegExp(`A in Higher ${subject}`), `About page must list "A in Higher ${subject}"`);
  }
});

test("the About page states all four current Advanced Higher subjects", () => {
  const about = source("components/tuition/tuition-about.tsx");
  for (const subject of ["Mathematics", "Physics", "Chemistry", "Mathematics of Mechanics"]) {
    assert.match(about, new RegExp(`Advanced Higher ${subject}`), `About page must list "Advanced Higher ${subject}"`);
  }
});

test("the About page states Finlay's age honestly, without apology", () => {
  const about = source("components/tuition/tuition-about.tsx");
  assert.match(about, /I(?:&apos;|')m 17|17,? based in Scotland|17 · National 5/);
  assert.doesNotMatch(about, /sorry|apologise|apologize/i);
});

test("primary CTAs describe the free first session, and no CTA claims a confirmed calendar booking", () => {
  for (const file of ["components/tuition/tuition-hero.tsx", "components/tuition/tuition-about.tsx", "components/tuition/tuition-navbar.tsx"]) {
    const text = source(file);
    assert.match(text, /free (?:first session|trial)/i, `${file} primary CTA should reference the free first session`);
    assert.doesNotMatch(text, />\s*Book a session\s*</, `${file} must not label an enquiry-only CTA as "Book a session"`);
  }
});

test("generic 'expert precision' positioning and the 'elevate your results' cliché are gone from every tuition file", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /expert precision/i, `${file} must not use "expert precision"`);
    assert.doesNotMatch(text, /elevate your results/i, `${file} must not use "elevate your results"`);
    assert.doesNotMatch(text, /no more monotonous lectures/i, `${file} must not use "No more monotonous lectures"`);
  }
});

test("no unsupported founder superlative or guarantee appears in presentation copy", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\bexpert\b/i, `${file} must not claim "expert" status`);
    assert.doesNotMatch(text, /\belite\b/i, `${file} must not claim "elite" status`);
    if (file !== "components/tuition/tuition-data.ts") {
      assert.doesNotMatch(text, /\bthe best\b/i, `${file} must not claim to be "the best"`);
    }
    assert.doesNotMatch(text, /guarantee(?:d)? (?:grade|result)/i, `${file} must not guarantee grade improvement`);
  }
  assert.match(
    source("components/tuition/tuition-data.ts"),
    /best tutor I could have had for my child/,
    "the supplied parent testimonial must remain identifiable as quoted feedback",
  );
});

test("no About-page placeholder bracket text remains anywhere on the tuition site", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\[Your name\]/, `${file} must not contain [Your name]`);
    assert.doesNotMatch(text, /\[Qualifications/, `${file} must not contain a [Qualifications...] placeholder`);
    assert.doesNotMatch(text, /\[X years\]/, `${file} must not contain [X years]`);
    assert.doesNotMatch(text, /\[Add (?:a |an )?(?:short|real|second)?\s*(?:bio|student quote)/i, `${file} must not contain an unfilled bio/quote placeholder`);
  }
});

test("the supplied 2+ years of tutoring experience is used without inventing a student count", () => {
  const combined = TUITION_FILES.map(source).join("\n");
  assert.match(combined, /2\+ years of tutoring experience/);
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\d+\+?\s*students?\s*(?:tutored|taught|helped)/i, `${file} must not claim a student count`);
  }
});

test("exactly five supplied testimonials ship with honest attribution and no invented identities", () => {
  assert.equal(tuitionTestimonials.length, 5);
  assert.equal(tuitionTestimonials.filter((testimonial) => testimonial.featured).length, 2);
  assert.equal(tuitionTestimonials.filter((testimonial) => testimonial.quantitative).length, 3);
  assert.ok(tuitionTestimonials.every((testimonial) => testimonial.attribution.length > 0));
  assert.ok(tuitionTestimonials.every((testimonial) => !("name" in testimonial)));
  assert.ok(tuitionTestimonials.some((testimonial) => /D in the Maths prelim to an A/.test(testimonial.quote)));
  assert.ok(tuitionTestimonials.some((testimonial) => /A in Higher Physics/.test(testimonial.quote)));
  assert.ok(tuitionTestimonials.some((testimonial) => /A in Higher Maths after failing her prelim/.test(testimonial.quote)));
  const componentSource = source("components/tuition/tuition-testimonials.tsx");
  assert.match(componentSource, /tuitionTestimonials\.length === 0/, "the component must gate on a data-driven length check");
  assert.match(componentSource, /return null/, "the component must remain safe if approved testimonials are removed later");
});

test("testimonials use a two-tier editorial layout rather than a generic card wall", () => {
  const componentSource = source("components/tuition/tuition-testimonials.tsx");
  assert.match(componentSource, /export function TuitionTestimonials/);
  assert.match(componentSource, /testimonial\.featured/);
  assert.match(componentSource, /featured\.map/);
  assert.match(componentSource, /supporting\.map/);
  assert.match(componentSource, /figure/, "the card layout (figure/blockquote/figcaption) must be preserved");
  assert.doesNotMatch(componentSource, /tuition-card/);
});

test("decorative Tuition kickers and process numbers are plain editorial text, not pills or circles", () => {
  const kicker = source("components/tuition/tuition-kicker.tsx");
  assert.doesNotMatch(kicker, /rounded-full|border border-warning|bg-warning-soft|px-3 py-1/);
  const about = source("components/tuition/tuition-about.tsx");
  const difference = source("components/tuition/tuition-difference.tsx");
  assert.doesNotMatch(about, /My philosophy/i);
  assert.doesNotMatch(about, /rounded-full/);
  assert.doesNotMatch(difference, /rounded-full/);
});

test("the About page describes the six concrete lesson stages", () => {
  const about = source("components/tuition/tuition-about.tsx");
  for (const stage of ["Review", "Diagnose", "Explain", "Work together", "Independent practice", "Next steps"]) {
    assert.match(about, new RegExp(`title: "${stage}"`));
  }
});

test("no disguised trust claims (student counts, star ratings, 'proven results', 'trusted by') replace real testimonials", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /trusted by/i, `${file} must not claim to be "trusted by" students`);
    assert.doesNotMatch(text, /proven results?/i, `${file} must not claim "proven results"`);
    assert.doesNotMatch(text, /star rating/i, `${file} must not add star ratings`);
  }
});

test("Orthic is described accurately: no claim of course completion, wide use, proven results, or exam-board affiliation/endorsement", () => {
  // tuition-footer.tsx is excluded here — it is the one file required to carry the negated
  // independence disclaimer, checked separately below.
  for (const file of TUITION_FILES.filter((file) => file !== "components/tuition/tuition-footer.tsx")) {
    const text = source(file);
    assert.doesNotMatch(text, /(?<!not )affiliated with (?:the )?SQA/i, `${file} must not claim SQA affiliation`);
    assert.doesNotMatch(text, /(?<!not )endorsed by (?:the )?SQA/i, `${file} must not claim SQA endorsement`);
    assert.doesNotMatch(text, /complete (?:curriculum|course library|platform)/i, `${file} must not claim Orthic is complete`);
    assert.doesNotMatch(text, /widely used/i, `${file} must not claim Orthic is widely used`);
  }
  const footer = source("components/tuition/tuition-footer.tsx");
  assert.match(footer, /not affiliated with or endorsed by Qualifications Scotland/i, "the independence disclaimer must remain in the footer");
});

test("Orthic positioning copy references structured, original, staged content rather than a finished product claim", () => {
  const combined = source("components/tuition/tuition-intro.tsx") + source("components/tuition/tuition-difference.tsx");
  assert.match(combined, /Orthic/);
  assert.match(combined, /structured|original|staged/i);
});

test("pricing is consistent: every visible rate traces back to tuitionLevels, and metadata prices match it", () => {
  const national5 = tuitionLevels.find((level) => level.slug === "national-5-maths");
  const higher = tuitionLevels.find((level) => level.slug === "higher-maths");
  assert.ok(national5 && higher);
  assert.equal(national5!.pricePerHour, tuitionLevels.find((level) => level.slug === "national-5-physics")!.pricePerHour, "National 5 Maths and Physics must charge the same rate");
  assert.equal(higher!.pricePerHour, tuitionLevels.find((level) => level.slug === "higher-physics")!.pricePerHour, "Higher Maths and Physics must charge the same rate");

  const pricingPageSource = source("app/tuition/pricing/page.tsx");
  assert.match(pricingPageSource, new RegExp(`£\\$\\{national5Price\\}|£${national5!.pricePerHour}`));
  assert.match(pricingPageSource, new RegExp(`£\\$\\{higherPrice\\}|£${higher!.pricePerHour}`));
});

test("no package, subscription or discount language is introduced", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\bsubscription\b/i, `${file} must not introduce a subscription`);
    assert.doesNotMatch(text, /\bdiscount\b/i, `${file} must not introduce a discount`);
    assert.doesNotMatch(text, /\bpackage deal\b/i, `${file} must not introduce a package deal`);
  }
});

test("the stale placeholder tuition contact route is removed and the limitation is explicit", () => {
  const formSource = source("components/landing/tuition-contact-form.tsx");
  assert.match(formSource, /Enquiries temporarily unavailable/);
  assert.match(formSource, /placeholder email address has been removed/);
  assert.doesNotMatch(formSource, /tuition@stemforge\.app|mailto:/);
});

test("key Tuition pages exist and import their navbar and footer (structural render check)", () => {
  for (const file of ["app/tuition/page.tsx", "app/tuition/about/page.tsx", "app/tuition/pricing/page.tsx"]) {
    const text = source(file);
    assert.match(text, /TuitionNavbar/, `${file} must render the shared navbar`);
    assert.match(text, /TuitionFooter/, `${file} must render the shared footer`);
  }
});

test("Tuition exposes only Home, About and Pricing as standalone pages", () => {
  const navbar = source("components/tuition/tuition-navbar.tsx");
  assert.doesNotMatch(navbar, /\/tuition\/subjects|\["Subjects"/);
  assert.equal(existsSync("app/tuition/subjects/page.tsx"), false);
  assert.equal(existsSync("components/tuition/tuition-subjects.tsx"), false);
});

test("mobile-sensitive layout classes are retained on the navbar and hero (bounded mobile correction, not a navigation rewrite)", () => {
  const navbar = source("components/tuition/tuition-navbar.tsx");
  assert.match(navbar, /max-md:grid-cols-1/, "the navbar must still collapse to a single column on mobile");
  const hero = source("components/tuition/tuition-hero.tsx");
  assert.match(hero, /flex-wrap/, "hero CTAs must still wrap on narrow viewports");
});

test("Tuition returns to the canonical Orthic waitlist rather than the learner app", () => {
  const navbar = source("components/tuition/tuition-navbar.tsx");
  assert.match(navbar, /href="https:\/\/orthic\.co\.uk\/"[^>]*>\s*Back to Orthic/);
  assert.doesNotMatch(navbar, /href="\/"[^>]*>\s*Back to Orthic/);
});

test("the homepage renders the tutor introduction before the final enquiry CTA", () => {
  const page = source("app/tuition/page.tsx");
  // Match JSX usage (<TuitionIntro) specifically, not the (alphabetically-sorted) import
  // statements, which would otherwise put TuitionCta's import before TuitionIntro's.
  const introIndex = page.indexOf("<TuitionIntro");
  const ctaIndex = page.indexOf("<TuitionCta");
  assert.ok(introIndex !== -1 && ctaIndex !== -1, "both components must be rendered in JSX");
  assert.ok(introIndex < ctaIndex, "<TuitionIntro /> must render before <TuitionCta /> in the JSX tree");
});
