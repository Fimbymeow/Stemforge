import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tuitionLevels, tuitionTestimonials } from "../components/tuition/tuition-data";

const source = (file: string) => readFileSync(file, "utf8");

const TUITION_FILES = [
  "app/tuition/page.tsx",
  "app/tuition/about/page.tsx",
  "app/tuition/pricing/page.tsx",
  "app/tuition/subjects/page.tsx",
  "components/tuition/tuition-hero.tsx",
  "components/tuition/tuition-intro.tsx",
  "components/tuition/tuition-about.tsx",
  "components/tuition/tuition-difference.tsx",
  "components/tuition/tuition-testimonials.tsx",
  "components/tuition/tuition-cta.tsx",
  "components/tuition/tuition-pricing.tsx",
  "components/tuition/tuition-navbar.tsx",
  "components/tuition/tuition-footer.tsx",
  "components/landing/tuition-contact-form.tsx",
];

test("Finlay's verified credential text (name, five Higher A's, Advanced Higher subjects) appears on the Tuition homepage", () => {
  const hero = source("components/tuition/tuition-hero.tsx");
  const intro = source("components/tuition/tuition-intro.tsx");
  const combined = hero + intro;
  assert.match(combined, /Finlay Kennedy/);
  assert.match(combined, /five Highers|A grades/i);
  assert.match(combined, /Advanced Higher Maths, Physics(?: and| &)? Chemistry/);
});

test("the About page states all five real Higher subjects as A grades, not a fabricated count", () => {
  const about = source("components/tuition/tuition-about.tsx");
  for (const subject of ["Mathematics", "Physics", "Chemistry", "Biology", "English"]) {
    assert.match(about, new RegExp(`A in Higher ${subject}`), `About page must list "A in Higher ${subject}"`);
  }
});

test("the About page states all three current Advanced Higher subjects", () => {
  const about = source("components/tuition/tuition-about.tsx");
  for (const subject of ["Mathematics", "Physics", "Chemistry"]) {
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

test("no banned superlative or unsupported claim (expert, elite, best, guaranteed) appears anywhere on the tuition site", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\bexpert\b/i, `${file} must not claim "expert" status`);
    assert.doesNotMatch(text, /\belite\b/i, `${file} must not claim "elite" status`);
    assert.doesNotMatch(text, /\bthe best\b/i, `${file} must not claim to be "the best"`);
    assert.doesNotMatch(text, /guarantee(?:d)? (?:grade|result)/i, `${file} must not guarantee grade improvement`);
  }
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

test("no invented experience, prior tutoring history, or student count is claimed", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /\d+\+?\s*years?\s*(?:of\s*)?(?:tutoring|teaching)\s*experience/i, `${file} must not claim a specific number of years' experience`);
    assert.doesNotMatch(text, /\d+\+?\s*students?\s*(?:tutored|taught|helped)/i, `${file} must not claim a student count`);
  }
});

test("the testimonials array is empty and TuitionTestimonials renders nothing (no invented quotes ship)", () => {
  assert.deepEqual(tuitionTestimonials, []);
  const componentSource = source("components/tuition/tuition-testimonials.tsx");
  assert.match(componentSource, /tuitionTestimonials\.length === 0/, "the component must gate on a data-driven length check");
  assert.match(componentSource, /return null/, "the component must return null while there are zero real testimonials");
});

test("the testimonial component and layout remain intact and reusable once real data is supplied", () => {
  const componentSource = source("components/tuition/tuition-testimonials.tsx");
  assert.match(componentSource, /export function TuitionTestimonials/);
  assert.match(componentSource, /tuitionTestimonials\.map/, "the render path for real testimonial data must still exist");
  assert.match(componentSource, /figure/, "the card layout (figure/blockquote/figcaption) must be preserved");
});

test("no disguised trust claims (student counts, star ratings, 'proven results', 'trusted by') replace real testimonials", () => {
  for (const file of TUITION_FILES) {
    const text = source(file);
    assert.doesNotMatch(text, /trusted by/i, `${file} must not claim to be "trusted by" students`);
    assert.doesNotMatch(text, /proven results?/i, `${file} must not claim "proven results"`);
    assert.doesNotMatch(text, /star rating/i, `${file} must not add star ratings`);
  }
});

test("Orthic is described accurately: no claim of course completion, wide use, proven results, or SQA affiliation/endorsement", () => {
  // tuition-footer.tsx is excluded here — it is the one file required to carry the negated
  // "not affiliated with or endorsed by SQA" disclaimer, checked separately below.
  for (const file of TUITION_FILES.filter((file) => file !== "components/tuition/tuition-footer.tsx")) {
    const text = source(file);
    assert.doesNotMatch(text, /(?<!not )affiliated with (?:the )?SQA/i, `${file} must not claim SQA affiliation`);
    assert.doesNotMatch(text, /(?<!not )endorsed by (?:the )?SQA/i, `${file} must not claim SQA endorsement`);
    assert.doesNotMatch(text, /complete (?:curriculum|course library|platform)/i, `${file} must not claim Orthic is complete`);
    assert.doesNotMatch(text, /widely used/i, `${file} must not claim Orthic is widely used`);
  }
  const footer = source("components/tuition/tuition-footer.tsx");
  assert.match(footer, /not affiliated with or endorsed by SQA/i, "the independence disclaimer must remain in the footer");
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

test("the contact form CTA text accurately reflects mailto behaviour, not a real submission", () => {
  const formSource = source("components/landing/tuition-contact-form.tsx");
  assert.doesNotMatch(formSource, />\s*Send enquiry\s*</, "the button must not claim to send anything directly");
  assert.match(formSource, /Open email to send enquiry/);
  assert.match(formSource, /doesn&apos;t submit anything|does not submit anything/i, "the limitation must be stated explicitly");
  assert.match(formSource, /mailto:/, "the underlying behaviour is still a mailto handoff");
});

test("the contact form fallback email link is present and entered field values are never cleared before the mailto navigation", () => {
  const formSource = source("components/landing/tuition-contact-form.tsx");
  assert.match(formSource, /mailto:\$\{CONTACT_EMAIL\}/);
  assert.doesNotMatch(formSource, /setName\(""\)|setEmail\(""\)|setMessage\(""\)/, "submitting must not clear entered details");
});

test("key Tuition pages exist and import their navbar and footer (structural render check)", () => {
  for (const file of ["app/tuition/page.tsx", "app/tuition/about/page.tsx", "app/tuition/pricing/page.tsx", "app/tuition/subjects/page.tsx"]) {
    const text = source(file);
    assert.match(text, /TuitionNavbar/, `${file} must render the shared navbar`);
    assert.match(text, /TuitionFooter/, `${file} must render the shared footer`);
  }
});

test("mobile-sensitive layout classes are retained on the navbar and hero (bounded mobile correction, not a navigation rewrite)", () => {
  const navbar = source("components/tuition/tuition-navbar.tsx");
  assert.match(navbar, /max-md:grid-cols-1/, "the navbar must still collapse to a single column on mobile");
  const hero = source("components/tuition/tuition-hero.tsx");
  assert.match(hero, /flex-wrap/, "hero CTAs must still wrap on narrow viewports");
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
