Perfect. We should rebuild the roadmap around **outcomes**, not an endless sequence of technical sprints.

The central objective is:

> **By late January 2027, STEM Forge should offer a complete, trustworthy Free learning experience for National 5 and Higher Maths, Physics, Chemistry and Biology, with real learner usage—and be ready to begin Premium rather than merely discussing it.**

That gives us five major programmes:

1. Stabilise and validate the existing product  
2. Perfect the Free learner loop  
3. Build the content-production engine  
4. Complete the eight-course library  
5. Validate retention and prepare Premium V1  

---

# STEM Forge Roadmap V2

## Current position

STEM Forge already has much more infrastructure than an ordinary early MVP:

- structured Higher Maths paths;
- question workspace and answer engine;
- progress and mastery evidence;
- Review foundations;
- accounts and ownership;
- guest-to-account import;
- cross-device sync architecture;
- account-data controls;
- production deployment;
- substantial automated testing;
- Alpha-testing documentation.

The immediate issue is no longer:

> Can STEM Forge technically exist?

It is:

> Can students use it reliably, learn from it, return voluntarily and eventually pay for deeper guidance?

The roadmap must now move away from prolonged infrastructure development and toward product validation, content production and distribution.

---

# Phase 0 — Production recovery and Alpha clearance

### Target: first half of August 2026

Nothing else matters until production is trustworthy.

## Required outcomes

- Current production database credentials restored
- Migration status obtained
- Pending migrations applied
- Sync pull returns `200`
- Account erasure returns `200`
- Readiness detects the actual latest schema
- Real-auth sync E2E passes
- Account-safety E2E passes
- Complete final verification gate passes
- Changes committed, deployed and production-tested

## Also complete

- Facilitator rehearsal
- Disposable Alpha accounts
- Alpha participant recruitment
- Consent workflow
- Session scheduling
- Final Go/No-Go review

## Exit criteria

Phase 0 is complete only when:

- guest use works;
- account creation works;
- progress survives refresh;
- progress syncs between devices;
- deletion and export controls work;
- `/api/health/ready` accurately reflects production;
- no critical Alpha blocker remains.

This is not a place for additional features.

---

# Phase 1 — Higher Maths Alpha

### Target: August 2026

The goal is not merely to test whether pages load. It is to understand the complete learner experience.

## Alpha cohort

Start with approximately:

- 3 learners for close facilitated testing;
- then 10–20 learners for a broader private Alpha;
- ideally a mix of stronger and weaker Higher Maths students.

## Test the complete loop

```text
Arrive
→ understand the product
→ choose the right path
→ learn
→ practise
→ receive marking
→ see progress
→ encounter Review
→ return later
```

## Questions to answer

- Can students work out where to begin?
- Do the notes actually teach?
- Do exercises progress sensibly?
- Is marking trusted?
- Does “mastery” make sense to students?
- Does Review feel useful?
- Do students know what to do next?
- Which parts confuse or frustrate them?
- Do they return without being prompted?

## Instrument only essential product metrics

Track:

- path started;
- lesson viewed;
- question attempted;
- exercise completed;
- path completed;
- Review due;
- Review completed;
- return within one day;
- return within seven days;
- reported content error.

Do not build a giant analytics platform yet.

## Exit criteria

- No severe onboarding failure
- No high-frequency marking defect
- Most learners can finish a path without facilitator rescue
- At least some learners return voluntarily
- Clear prioritised Alpha findings exist
- Major learner-facing fixes are identified

---

# Phase 2 — Free Core V1

### Target: August to early September 2026

This phase converts the Alpha product into a strong reusable learner platform.

## 2.1 Learn experience

Each published path should contain:

- clear objective;
- prerequisite visibility;
- concise teaching notes;
- worked examples;
- common mistakes;
- logical progression into practice;
- an obvious next action.

The notes should feel like instruction, not a specification summary.

## 2.2 Practise experience

Standardise:

- Foundations;
- Applications;
- exam-style practice;
- question feedback;
- solution presentation;
- retry behaviour;
- exercise completion.

## 2.3 Mastery experience

Students should understand:

- what completion means;
- what mastery means;
- why a path may need further work;
- how evidence changes their progress.

Avoid displaying sophisticated internal evidence concepts in technical language.

## 2.4 Review V1

Free Review should provide:

- daily queue;
- approximately 10–15 questions;
- basic spacing;
- weak-skill weighting;
- mixed retrieval;
- clear completion;
- overdue-item recovery;
- direct explanation of why an item appeared.

Review must become useful before it becomes monetised.

## 2.5 “What next?” guidance

The dashboard and course hubs should prioritise:

1. continue current path;
2. complete due Review;
3. repair prerequisite;
4. begin next recommended skill.

Remove or de-emphasise information that does not influence action.

## 2.6 Public lesson foundations

Prepare paths so they can later support public topic pages:

- stable URLs;
- useful metadata;
- shareable previews;
- public notes or selected examples;
- clear path into interactive practice.

Full SEO expansion can come later, but the structure should not block it.

## Exit criteria

A Free user can:

- find a course;
- learn a skill;
- complete practice;
- receive trustworthy marking;
- understand progress;
- receive a useful next action;
- return through Review.

---

# Phase 3 — Content Production System

### Target: August 2026, overlapping with Higher Maths completion

This is one of the most important programmes. Without it, the January content target becomes chaotic.

## 3.1 Canonical specification map

For every course, record:

- official specification version;
- mandatory knowledge;
- assessed skills;
- depth boundaries;
- exclusions;
- relevant practical and data skills;
- mapping from specification statements to paths.

Every specification point must map to at least one path.

## 3.2 Final skill-path taxonomy

Create the complete path map for:

- National 5 Maths;
- Higher Maths;
- National 5 Physics;
- Higher Physics;
- National 5 Chemistry;
- Higher Chemistry;
- National 5 Biology;
- Higher Biology.

Before bulk production, each path should have:

- title;
- scope;
- prerequisites;
- specification references;
- expected question types;
- marking modes;
- diagram requirements;
- approximate difficulty.

## 3.3 Locked content template

Every path should follow one standard:

```text
Scope and boundaries
→ teaching notes
→ worked examples
→ misconceptions
→ Foundations
→ Applications
→ exam-style practice
→ answers and marking data
→ QA
```

## 3.4 Content workflow

Recommended states:

```text
Planned
→ Drafting
→ Spec checked
→ Answers checked
→ Marking checked
→ Editorially reviewed
→ Accepted
→ Published
```

Only **Accepted** paths count toward production targets.

## 3.5 AI production workflow

For each path:

1. AI studies the canonical specification extract.
2. AI studies calibrated past-paper patterns.
3. AI drafts notes and exercises.
4. A separate AI pass critiques specification compliance.
5. A separate solving pass verifies every answer.
6. You perform final editorial and subject review.
7. Automated validation checks required fields.
8. The path is accepted or returned for revision.

AI may produce most of the draft labour, but it cannot decide final correctness.

## 3.6 Contributor-readiness

Even before hiring, prepare:

- contributor handbook;
- example gold-standard path;
- acceptance rubric;
- question originality rules;
- specification-reference requirements;
- revision expectations;
- intellectual-property assignment;
- audit trail.

This allows a Physics, Chemistry or Biology contributor to become useful quickly.

## 3.7 Coverage dashboard

Internally track:

- total paths planned;
- paths by status;
- specification coverage;
- missing exercises;
- missing answers;
- paths requiring diagrams;
- unresolved QA issues;
- last reviewed date.

This can begin as a spreadsheet or internal report. It does not initially require a polished application UI.

## Exit criteria

A new path can be produced repeatedly without redesigning the process each time.

---

# Phase 4 — Complete Maths

### Target: end of August 2026

You currently expect Maths to finish within approximately one month.

## Higher Maths

Finish:

- complete taxonomy;
- remaining skill paths;
- teaching notes;
- all core exercises;
- answer and marking data;
- course-level QA;
- specification coverage audit;
- mobile learner testing.

## National 5 Maths

There are two possible interpretations of “Maths finished”:

### Option A: only Higher Maths complete by August

Then National 5 Maths must be included in the autumn production plan.

### Option B: both National 5 and Higher Maths complete

This would substantially reduce January pressure.

Based on previous progress, I would not assume National 5 is complete unless we explicitly audit it.

## Maths exit criteria

- Every specification point mapped
- Every path contains teaching and practice
- Core marking reliable
- Course navigation coherent
- Mixed and exam-style practice available
- No severe content gaps
- Learner feedback incorporated
- Course labelled honestly as complete or Beta complete

---

# Phase 5 — Science Platform Foundations

### Target: late August to early September 2026

Before writing 200 science paths, the platform must support science properly.

## Required answer types

Prioritise:

- exact numeric;
- tolerance-based numeric;
- significant figures;
- units;
- multiple choice;
- multi-select;
- short text;
- ordered steps;
- table completion;
- equation completion;
- guided marking points;
- diagram-based responses where practical.

## Trust model for written answers

Use three levels:

### Automatically marked

The system is highly confident and deterministic.

### Assisted marking

The system identifies likely marking points but clearly expresses uncertainty.

### Guided self-marking

The student compares their response against structured criteria.

Do not force every answer into fake automatic marking.

## Diagram system

Create reusable support for:

- circuits;
- forces and vectors;
- rays and waves;
- apparatus;
- chemical structures;
- biological structures;
- graphs and tables.

A reusable diagram library is essential to maintain production speed.

## Scientific notation and representation

Support:

- formulae;
- units;
- prefixes;
- significant figures;
- state symbols where needed;
- chemical equations;
- structural representations;
- scientific symbols;
- superscripts and subscripts.

## Exit criteria

At least one representative path from each science can be fully delivered without manual hacks.

---

# Phase 6 — Science Content Production

### Target: September 2026 to mid-January 2027

Central estimate:

| Course | Approximate paths |
|---|---:|
| National 5 Physics | 29 |
| Higher Physics | 35 |
| National 5 Chemistry | 33 |
| Higher Chemistry | 41 |
| National 5 Biology | 33 |
| Higher Biology | 42 |
| **Total** | **213** |

To complete by mid-January, average:

> **approximately 10 accepted paths per week**

Measure weekly, not daily.

## Recommended release order

### September: National 5 Physics

Physics is the best first science because:

- it aligns with the existing Maths answer engine;
- many answers are objectively checkable;
- diagrams can be standardised;
- you can judge it confidently.

During September also begin Higher Physics.

### October: Higher Physics and National 5 Chemistry

Complete Higher Physics, then move into Chemistry.

Science-platform defects found during Physics should be fixed before Chemistry volume increases.

### November: Higher Chemistry

Higher Chemistry requires more:

- representations;
- explanation;
- experimental interpretation;
- calculations;
- reaction pathways.

Reserve more time per difficult path.

### December: National 5 Biology and begin Higher Biology

Biology should use structured marking points and honest self-marking wherever automated marking is not reliable.

Do not pretend keyword matching equals marking.

### Early January: finish Higher Biology

Content production should ideally stop by approximately mid-January.

### Mid-to-late January: whole-library QA

Reserve time for:

- specification coverage;
- duplicate checking;
- broken marking rules;
- course ordering;
- mobile behaviour;
- performance;
- student testing;
- correction of reported problems.

## Staggered publication

Do not wait until January to release everything.

Publish individual courses once they pass QA:

- N5 Physics;
- Higher Physics;
- N5 Chemistry;
- Higher Chemistry;
- N5 Biology;
- Higher Biology.

By late January, present them as the complete Maths and Science suite.

## January completion definition

The most realistic target is:

> **Beta complete across all eight courses**

This means:

- all specification points taught;
- meaningful practice everywhere;
- reliable deterministic marking where suitable;
- structured self-marking for difficult written responses;
- known limitations stated;
- active error-correction process.

It does not require perfect AI marking for every Biology response.

---

# Phase 7 — Distribution V1

### Target: begin during autumn, not after content is finished

Distribution must run alongside production.

## 7.1 Student acquisition

Use:

- your tutoring students;
- school contacts;
- learner referrals;
- Scottish student communities;
- TikTok;
- YouTube;
- searchable lesson pages;
- revision-season content.

## 7.2 Founder-led content

Possible content types:

- one-minute SQA explanations;
- common Higher Maths mistakes;
- “Can you solve this?” questions;
- prelim preparation;
- walkthroughs of STEM Forge features;
- transparent build journey;
- Scottish qualification guidance.

The founder story is an advantage, but the content must primarily help students.

## 7.3 Referral loop

Later in the autumn, test a simple referral mechanism:

- share a path;
- share a question;
- invite a classmate;
- earn a non-essential cosmetic or convenience benefit.

Do not paywall learning rewards.

## 7.4 Tutor pilot

Invite a small number of tutors to:

- assign paths informally;
- view learner summaries manually or through limited tooling;
- give feedback on what would save them time.

Do not yet build full Tutor Premium.

## 7.5 Public topic pages

Gradually publish searchable pages targeting queries such as:

- Higher Maths differentiation questions;
- National 5 Physics waves notes;
- Higher Chemistry calculations;
- National 5 Biology cell structure revision.

## Exit criteria

By January, STEM Forge should not be launching to an empty room.

---

# Phase 8 — Measurement and retention

### Target: September 2026 onward

The product should make decisions from real behaviour.

## Primary metrics

### Activation

A student:

- starts a path;
- completes meaningful practice;
- receives marking;
- sees their next action.

### Retention

Track:

- day-one return;
- seven-day return;
- four-week activity;
- Review return rate.

### Learning engagement

Track:

- paths completed;
- questions attempted;
- accuracy;
- Review completion;
- mastery changes;
- error reports.

### Commercial intent

Later track:

- students reaching Free limits;
- Premium feature interest;
- willingness-to-pay responses;
- upgrade-page visits;
- conversion.

## Avoid vanity metrics

Do not obsess over:

- total account registrations;
- total page views;
- total questions ever attempted;
- social followers without learner conversion.

The strongest metric may become:

> Percentage of activated learners who complete meaningful study in a later week.

---

# Phase 9 — Premium validation

### Target: December 2026 to February 2027

Do not build full Premium before validating its proposed value.

## Validate the core propositions

Ask learners whether they value:

- unlimited Review;
- a personalised study plan;
- advanced analytics;
- targeted exam-style sets;
- weekly progress reports.

Test through prototypes or manually delivered experiences.

For example:

- manually provide five learners with a personalised weekly plan;
- see whether they follow it;
- ask whether it changed their study behaviour;
- test willingness to pay.

## Premium V1 candidate

1. Unlimited adaptive Review  
2. Personal study plan  
3. Advanced analytics  
4. Intelligent practice sets  
5. Weekly report  

## Conditions to start building

- Free users complete meaningful work
- Review creates repeat visits
- Learners understand the product
- Core content is trusted
- At least some users reach natural limits
- Clear willingness-to-pay evidence exists
- January content production is not endangered

---

# Phase 10 — Premium V1 development

### Earliest sensible period: February 2027 onward

Once the full January release is stable, development can shift toward monetisation.

## Programme order

### Premium foundation

- entitlements;
- subscription state;
- billing safety;
- cancellation;
- account recovery;
- transparent usage limits;
- feature gates without damaging Free.

### Unlimited adaptive Review

Build this first if Review has already shown retention value.

### Personal study plans

Use:

- exam date;
- current mastery;
- Review load;
- available study time;
- course coverage;
- missed work.

### Advanced analytics

Only provide insights that change the next action.

### Intelligent sets

Allow:

- weak skills;
- mixed topics;
- targeted difficulty;
- timed sessions;
- exam-priority selection.

## Premium exit criterion

A paying student can clearly explain why Premium is worth money:

> It plans my studying, adapts practice around my weaknesses and helps me prepare efficiently.

---

# Phase 11 — Tutor product

### Target: after Student Premium evidence, likely 2027

Start with small tutors, not schools.

## Tutor V1

- learner management;
- assignments;
- deadlines;
- completion status;
- weak-skill summary;
- attempt inspection;
- basic progress reports.

## Tutor validation

Your own tutoring operation should become the first internal customer.

Only build tools that demonstrably save tutor time or improve learner support.

---

# What remains outside the roadmap for now

These should not enter near-term development:

- full school platform;
- social feed;
- unrestricted AI chatbot;
- tutoring marketplace;
- international curricula;
- elaborate parent monitoring;
- advanced predictive grading;
- white-label school systems;
- large-scale AI free-text marking without reliability evidence.

They remain future possibilities, not active commitments.

---

# Proposed roadmap calendar

| Period | Main objective |
|---|---|
| Early August 2026 | Production recovery and Alpha clearance |
| August | Higher Maths Alpha, Free Core improvements, content pipeline |
| End of August | Maths completion target and science platform readiness |
| September | N5 Physics, begin Higher Physics, distribution starts |
| October | Higher Physics and N5 Chemistry |
| November | Higher Chemistry |
| December | N5 Biology and begin Higher Biology |
| Early January 2027 | Finish Higher Biology |
| Mid–late January | Full-library QA and complete post-prelim release |
| February onward | Premium V1 development, subject to validation |
| Later 2027 | Tutor product and deeper Premium features |

---

# Weekly operating model

From September:

## Content

- target 10 accepted paths per week;
- weekly specification-coverage check;
- weekly correction batch;
- course-level QA continuously, not only at the end.

## Product

- fix only learner-blocking or content-enabling issues;
- one small learner-experience improvement cycle per week;
- no major unrelated engineering programme.

## Users

- speak to or observe at least one learner every week;
- review reported errors;
- inspect retention;
- collect direct quotes and objections.

## Distribution

- publish useful student-facing content consistently;
- build searchable topic pages;
- recruit testers continuously.

---

# Roadmap governance rules

These should prevent scope explosion.

A new item enters the near roadmap only if it directly improves one of:

1. content production;
2. learning;
3. practice;
4. trustworthy marking;
5. Review;
6. retention;
7. January release;
8. Premium validation.

Every proposed feature should answer:

- Which user problem does it solve?
- What evidence says the problem matters?
- Why now?
- What gets delayed if we build it?
- How will we know it worked?

## Freeze rule

Until the January suite is delivered:

> No major feature programme unless it is required for science content, learner trust, retention, distribution or operational safety.

---

# Immediate next programme

The roadmap begins with:

## Programme 7 — Production Recovery and Alpha Execution

Likely workstreams:

1. Resolve migration credentials and production schema  
2. Complete final verification  
3. Deploy readiness and diagnostics corrections  
4. Production smoke and authenticated checks  
5. Facilitator rehearsal  
6. Run Session A  
7. Run Session B  
8. Run Session C  
9. Consolidate findings  
10. Make Alpha Go/No-Go decision  

After that:

## Programme 8 — Free Learner Loop V1

- Learn
- Practise
- mastery
- Review
- what-next guidance
- learner-facing simplification

Then:

## Programme 9 — Content Production Engine

Then:

## Programme 10 — Complete Maths and Science Foundations

This is the roadmap structure I would lock before converting it into individual technical sprints.
