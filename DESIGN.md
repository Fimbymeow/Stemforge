# Orthic Design System Specification
**Version:** 2.1 (Definitive Implementation Standard)\
**Status:** Canonical Visual & Interaction System

---

## 0. Purpose & Authority

This document defines the definitive design system and implementation specification for **Orthic**.

It is extracted directly from the final approved screen designs across the product lifecycle:
1. **Dashboard** (Re-entry & daily study plan)
2. **Courses / Subject Discovery** (Enrolled course library & curriculum catalog)
3. **Higher Maths Course Hub** (Syllabus structure, curriculum unit navigation & competency ledgers)
4. **Skill Page — Basic Differentiation** (Skill identity, learner confidence & 4-stage pathway)
5. **Notes / Lesson Reader** (Editorial mathematical prose & worked derivations)
6. **Question Workspace** (Focus mode — unanswered and marked/solved states)

It supersedes all previous visual exploration drafts, experimental variants, and ungrounded mockups.

### The Implementation Rule: Product Truth Wins
The Stitch screens establish **visual composition, hierarchy, spatial rhythm, and aesthetic character**. They do **not** define literal mock data, synthetic analytics, or invented platform features.

When implementing any page or component:
1. **Preserve existing Orthic architecture, data models, and semantics.**
2. **Use authentic Orthic curriculum data, learner state, and canonical workflows.**
3. **Apply the typography, surface, divider, and layout rules documented here.**
4. **Simplify unnecessary visual artifacts or exploratory metadata.**
5. **Never invent platform features, fake analytics, or institutional bureaucracy to fill empty space.**
6. **Target WCAG 2.1 AA, preserve existing accessibility behaviour, and maintain semantic, focus, contrast, and touch-target requirements.**
7. **When visual reference conflicts with real product behaviour, Product Truth Wins.** If an element shown in an exploratory design is not backed by real learner data or functionality, **remove it**.

---

## 1. Core Design Character

Orthic is:
> **Scottish scope, world-class execution.**\
> A beautifully typeset academic learning environment where authoritative curriculum documents, classical mathematics typography, and quiet modern software meet.

### The Character Spectrum
- **It is:** Calm, precise, serious, intellectually respectful, typography-led, disciplined, and authored.
- **It is NOT:** Generic SaaS, Tailwind component soup, LMS software, school administration/ERP portals, university research apparatus, gamified edtech (Duolingo/Quizlet), an AI dark-mode tool, or a fintech analytics dashboard.

Academic sophistication is an **editorial and typographic quality**, never an institutional roleplay.

### Visual Foundations
- **Surfaces:** Warm paper / off-white canvas backgrounds (`#f8f9fd` / `#f9fafb`) paired with pure white elevated focal surfaces (`#ffffff`).
- **Contrast & Inks:** Deep academic navy and charcoal inks (`#0f172a` / `#111827`) providing authoritative contrast without harsh pure black.
- **Restrained Semantic Accents:**
  - **Amber:** Strictly reserved for review due alerts, pending attention, and warning notes (`#fef3c7` bg, `#b45309` text, `#fde68a` border).
  - **Quiet Green:** Verified completion and correct mathematical answers (`#f0fdf4` bg, `#166534` text, `#bbf7d0` border).
  - **Muted Rose:** Incorrect answer feedback and revision alerts (`#fef2f2` bg, `#991b1b` text).
  - **Subtle Academic Blue:** Brand emphasis and informational chips (`#eff6ff` bg, `#1e3a5f` text).
- **Hairline Rules & Dividers:** Subtle, crisp 1px dividers (`#e2e8f0` / `#e5e7eb`) establish structure and separate document sections without adding heavy boxed containers.
- **Restrained Radii:** Modest border radii:
  - Small tags / badges / buttons: `rounded` (4px) or `rounded-md` (6px)
  - Cards & dominant hero panels: `rounded-lg` (8px)
  - Overly soft pills (`rounded-2xl`, `rounded-3xl`, `rounded-full`) must not be used for content cards or structural wrappers.
- **Minimal Shadows:** Standard panels and cards rely on hairline borders (`1px solid #e2e8f0`) rather than drop shadows. Elevation (`shadow-sm` or `shadow-md`) is restricted to floating dialogs, popovers, or tooltips.

---

## 2. Fundamental Architectural Rule: Hierarchy Before Containers

**Do not wrap every distinct piece of information in a bordered card.**\
A page with six items must not become a grid of six cards. Establish structure using:
1. Typography size, weight, and hierarchy
2. Generous and intentional whitespace rhythm
3. Subtle hairline dividers (`border-t border-border` / `#e2e8f0`)
4. Tabular and row-based alignment
5. Indentation and subtle background shifts

Containers (cards) are strictly reserved for:
- Discrete, self-contained interactive units (e.g., the dominant **Current Focus / Continue Learning** card).
- Authored progression modules (e.g., the 4-stage pathway).
- Focused modal dialogues or detached reference sheets.

---

## 3. Information Discipline & Subtraction

Every visible element must justify its existence through at least one of these four criteria:
1. **A real learner action** (e.g., `Resume Exercise →`, `Open Notes`, `Submit Answer`)
2. **Real curriculum structure** (e.g., Course, Unit, Strand, Skill)
3. **Real learner state** (e.g., current stage, review due status, self-rated confidence)
4. **Real learning content** (e.g., mathematical formulas, worked examples, questions)

**Empty whitespace is always preferable to invented information.** If a metric, badge, or card does not represent genuine student reality, strike it from the DOM.

---

## 4. Typography System

Typography carries 80% of Orthic's visual hierarchy. Pages must feel **typeset**, like a contemporary edition of an authoritative Cambridge or Oxford University Press mathematical textbook.

### Font Roles
The design system defines **font roles** first. Specific font families are illustrative examples unless selected in the real product:
1. **Primary Interface Sans-Serif Role:** Clean, highly legible neutral sans-serif (e.g., `Inter`, system neutral sans) for all navigation, headings, metadata, controls, and UI copy.
2. **Editorial Reading Serif Role (Lesson Notes):** For mathematical prose, conceptual exposition, and reflective notes, a refined serif (e.g., `Newsreader`, `Source Serif`, `Charter`) may be employed for extended reading comfort.
3. **Mathematical Notation Role:** Formally rendered TeX/KaTeX for all formulas, variables, equations, and expressions.
4. **Monospace Metadata Accent Role:** Standard monospace (e.g., `JetBrains Mono`, `ui-monospace`, `monospace`) strictly for micro-labels, code variables, specification indices, and technical coordinates (e.g., `STAGE 01 / 04`, `d/dx [x^n]`). **Monospace must never be used for learner-facing sentences or paragraphs.**

### Typographic Hierarchy

| Role | Font Style & Weight | Size / Leading | Case & Tracking | Example Application |
|---|---|---|---|---|
| **Page Title** | Sans, Semibold / Bold (700) | 28px–32px / 1.2 | Sentence case, -0.02em | `Higher Mathematics`, `Courses`, `Good afternoon, Finlay.` |
| **Section Heading** | Sans, Bold (700) | 18px–20px / 1.3 | Sentence case | `Course Units`, `Your Courses`, `Calculus Competencies` |
| **Subsection / Card Title** | Sans, Semibold (600) | 15px–16px / 1.4 | Sentence case | `Basic differentiation`, `Evaluate a derivative` |
| **Body Text** | Sans or Serif, Regular (400) | 14px–15px / 1.6 | Sentence case | Descriptive lesson text, notes explanations, exercise prompts |
| **Supporting / Meta** | Sans, Regular (400) | 12px–13px / 1.5 | Sentence case | `"Current focus: Basic differentiation"`, `"Skills complete: [count]"` |
| **Micro-Label / Overline** | Mono or Sans, Medium (500) | 10px–11px / 1.2 | ALL CAPS, +0.05em | `CURRENT FOCUS`, `STAGE 02 · ACTIVE`, `UNIT SPECIFICATION` |
| **Mathematical Display** | KaTeX / Math Serif | 16px–22px / 1.4 | Standard Math TeX | `f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}` |

### Mathematical Typography Rules
- **Zero Raw Strings:** Never render raw ASCII notation like `f'(x) = 3x^2 + 2x` or `(ax+b)^n` in learner-facing UI. Use KaTeX/MathJax rendering.
- **Generous Spatial Framing:** Math equations require breathing room. Display formulas should have generous vertical padding (`my-3` to `my-5`) and never be cramped inside tight horizontal containers.
- **Inline Variables:** Single mathematical symbols (e.g., $x$, $y$, $f(x)$, $m$) must be italicized or typeset in math font even inside prose sentences.

---

## 5. Application Shell & Layout

The application shell provides **calm spatial orientation** without competing with learning tasks.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP CONTEXT BAR: [Breadcrumb / Context]                      [User: Finlay] │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ GLOBAL NAV    │ WORKSPACE CANVAS                                            │
│               │                                                             │
│ ⌂ Home        │ (Page Content: Dashboard / Course Hub / Workspace)          │
│ 🕮 Courses (*) │                                                             │
│ ✎ Practice    │                                                             │
│ ⟲ Review      │                                                             │
│ ◔ Activity    │                                                             │
│ ⚙ Account     │                                                             │
│               │                                                             │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

### Desktop Shell Principles
1. **Persistent Quiet Left Sidebar:**
   - Width: `w-56` to `w-64` (220px–256px).
   - Brand mark: Quiet **ORTHIC** wordmark with minimalist delta glyph at top left.
   - Core persistent navigation items: `Home`, `Courses`, `Practice`, `Review`, `Activity`, `Account`.
   - Active state: Subtle background tint (`bg-surface-dim` or soft slate-100), deep navy text, thin indicator. Never an aggressive filled neon pill.
2. **Top Context Bar:**
   - Displays academic breadcrumbs (e.g., `Courses > Higher Maths > Calculus > Basic differentiation`).
   - Learner profile indicator on the right (`Finlay` + avatar/monogram).
   - On focused learning pages, this bar recedes into a single quiet back-link (`← Higher Maths`).
3. **Canvas Adaptation by Focus Level:**
   - **Orientation surfaces (Dashboard, Courses):** Full standard sidebar visible. Broad canvas with clear horizontal hierarchy.
   - **Curriculum surfaces (Course Hub, Skill Page):** Sidebar remains visible; top bar provides exact breadcrumb positioning.
   - **Learning surfaces (Notes, Question Workspace):** Focus mode. Navigation chrome recedes to give the mathematics maximum horizontal breathing room (65–75ch reading measure; zero analytics or sidebar distractions).

---

## 6. Information Density by Surface

Orthic rejects the "one density fits all" doctrine. Different surfaces serve distinct cognitive purposes:

| Surface Type | Primary Objective | Cognitive State | Density Level | Dominant Design Treatment |
|---|---|---|---|---|
| **Orientation**<br>*(Dashboard, Courses)* | *"What should I do next?"*<br>*"What am I studying?"* | Calm, decisive, directional | Low to Moderate | Single dominant action card, hairline rules, clean list rows. |
| **Curriculum**<br>*(Course Hub, Skill Page, Tracker)* | *"What is inside this course and where am I?"* | Structured, analytical, scoping | Moderate to High | Authoritative unit selectors, tabular competency ledgers, stage progression. |
| **Learning**<br>*(Notes, Question Workspace)* | Reading, solving, deriving, mastering mathematics | High focus, deep attention | Pure Focus | Editorial line lengths (65–75ch for prose), generous math canvas, zero analytics. |

---

## 7. Product Truth & Canonical Language

Implementation must only expose real Orthic concepts. Fictional institutional language and synthetic intelligence are strictly banned.

### Learner-Facing Product Concepts
- **Home:** Primary re-entry point and daily study plan.
- **Courses:** Enrolled subjects and curriculum discovery.
- **Course Hub:** The complete syllabus for a single subject (e.g., Higher Maths).
- **Course Structure:** Real curriculum areas, units, or strands as modelled in the authentic course data (e.g., `course → real curriculum areas/units/strands → skills`). Do not mandate fixed counts or hardcoded unit structures across all qualifications.
- **Skill:** The atomic learning module (e.g., *Basic differentiation*). Note: *"Canonical skill"* is an internal architectural term used when describing data models and implementation; learner-facing UI should say **skill**.
- **Curriculum Pathway:** The 4 authored progression stages for a skill:
  1. `Notes` (theory, definitions, worked examples)
  2. `Foundations` (drill exercises, fundamental mechanics)
  3. `Applications` (contextual problems, geometric applications, rates of change)
  4. `Exam practice` (original Orthic-authored questions calibrated to historical Scottish assessment patterns, specification-valid, with Orthic worked solutions and marking guidance)
- **Review:** Orthic's spaced-review system for previously learned skills. **Review is NOT Stage 5 of the pathway.** It is an independent consolidation feature that prompts review for completed skills. It must remain conceptually distinct from the four authored learning stages. Do not expose internal mechanics (e.g., "retrieval engine", "decay intervals", "mastery decay", "review queue") to learners unless the real product explicitly surfaces them.
- **Practice:** Self-directed drills and targeted question selection.
- **Question Bank:** Question repository filterable by topic (avoid claiming "comprehensive" unless validated by actual content coverage).
- **Course Tracker:** Structured view of curriculum coverage and learner state (avoid "mastery checklist" terminology).
- **Build a Test:** Targeted test configuration interface.
- **Mistake Log:** Questions and mistakes worth revisiting (avoid "error analysis and revision queue").
- **Past Papers:** Authentic official historical exam resources and past-paper links.

### CRITICAL: Exam Practice vs Past Papers
These two concepts must never be confused:
- **Exam practice:** Original, Orthic-authored learning content within the 4-stage skill pathway. Questions are calibrated to Scottish qualification standards, are specification-valid, and include Orthic's own worked solutions and marking guidance. It does **not** contain copied official exam questions or official mark schemes.
- **Past Papers:** A separate utility surface providing links and access to genuine official historical past-paper sittings and resources.

### Awarding Body Terminology
- Do not treat "SQA" as the current awarding-body name in learner-facing UI.
- Prefer neutral and current terminology: **Qualifications Scotland**, **Scottish qualifications**, or qualification names like **Higher Maths**.
- Historical SQA resources or past papers may be referenced in historical context, but active learner-facing copy must never imply that SQA is the current awarding body.
- Never hardcode mock specification codes (such as `SQA C1.1` or `SQA C847 76`) unless they exist in the real product data.
- Never imply accreditation, endorsement, affiliation, or certification by Qualifications Scotland.

### Learner Confidence System
Learner confidence is **self-rated and learner-owned**. It is never a synthetic algorithm score or automated percentage.
- Three Discrete States:
  1. `Needs work`
  2. `Developing`
  3. `Confident`
- UI Representation: Segmented horizontal button group. If platform evidence disagrees with learner confidence (e.g., student rated "Confident" but missed recent exercises), communicate this with a quiet, polite note below the selector (e.g., *Orthic suggests reinforcement on negative indices*). Never override the student's rating.

---

## 8. Surface-by-Surface Specifications

*(Note: All metrics, skill counts, and numbers below are illustrative examples and must come dynamically from the real Orthic data repository rather than being hardcoded into the architecture.)*

### 8.1 Dashboard (The Re-Entry Point)
- **Header:** Warm, small greeting: `Good afternoon, Finlay.` with an optional concise context line: `Your study plan, active courses, and spaced review schedule.`
- **Primary Object — Continue Learning:**
  - One dominant white card (`bg-surface rounded-lg border border-border p-6`).
  - Contains: active subject badge (e.g., `HIGHER MATHS`), skill title (e.g., `Basic differentiation`), optional review badge if due (e.g., `Due for review`), stage progression breadcrumb (`Notes → Stage 2: Foundations → Applications → Exam practice`), and one high-contrast primary CTA button (`Resume Foundations →`).
- **Document Sections (Divided by hairline rules, not card grids):**
  - **Study Plan:** Single-line recommendation (e.g., `Complete Foundations for Basic differentiation before advancing to The Chain Rule.`) with a direct `START →` link.
  - **Your Courses (Scalable list):** Clean, tabular row list (not cards). Each row includes: Subject Name, Enrolled/Focus tag, authentic skill progress count, active review alert if present (e.g., `1 review due`), and secondary action buttons (`Course hub`, `Resume →`).
  - **Scoped Review:** Surfaces due reviews for enrolled subjects without urgency theater.
  - **Activity (Quiet History):** Low-contrast cadence representation or sparkline. No streaks, no flame emojis, no XP.

### 8.2 Courses & Subject Discovery
- **Header:** Minimalist title: `Courses` with subtitle: `Your active courses and available curriculum tracks.`
- **Your Courses Section:**
  - Compact horizontal rows for currently enrolled subjects.
  - Shows current focus skill, authentic progress count, review badge if due, and direct `Continue →` button.
- **Explore Courses Catalog:**
  - Clean, 2-column or 3-column quiet cards for un-enrolled tracks (e.g., *Advanced Higher Mathematics*, *Higher Computing Science*).
  - Contains: Course title, concise 1-sentence description, availability status, and `View course →` link.
  - No institutional accreditation jargon or fake enrolment countdowns.

### 8.3 Curriculum & Course Hub (e.g., Higher Maths)
- **Course Identity:** Bold heading `Higher Mathematics` with overall authentic syllabus progress.
- **Current Focus Hero:** Dominant interactive card anchoring the active skill with definition formula and direct `Resume Exercise →` button.
- **Course Tools Row:** Unified 5-item utility row with restrained iconography:
  - `Practice` — *Targeted drills by topic*
  - `Question Bank` — *Browse and filter questions*
  - `Review` — *Scheduled skill review* (with amber alert badge if due)
  - `Course Tracker` — *Structured view of curriculum coverage*
  - `Past Papers` — *Official past papers and historical resources*
- **Course Units Navigator:** Horizontal tab bar representing the authentic course curriculum areas/units/strands (e.g., for Higher Maths: *Algebra & Trig*, *Vectors in 3D*, *Calculus*, *Lines, Circles & Recurrence*).
- **Competency Ledger:**
  - Clean table/row layout for skills within the selected unit.
  - Each row features: Index/code if present, Skill Name (e.g., `Basic differentiation`), sub-topics, current stage badge, and an action button (`Continue →`, `Start Drill →`, `Study →`).

### 8.4 Skill Page (e.g., Basic Differentiation)
- **Top Specification Header:**
  - Strand/Curriculum breadcrumb: e.g., `HIGHER MATHS · CALCULUS`
  - Title: `Basic differentiation`
  - Concise authored definition of the mathematical skill.
  - Embedded learner confidence component on the right (`Needs work` / `Developing` / `Confident`) with the primary CTA.
- **The 4-Stage Curriculum Pathway:**
  - 4 equal-width progression blocks:
    1. `Stage 01: Notes` (Theory, definitions, worked examples)
    2. `Stage 02: Foundations` (Active mechanical practice)
    3. `Stage 03: Applications` (Contextual and geometric problem solving)
    4. `Stage 04: Exam practice` (Orthic-authored exam-standard questions with full Orthic marking guidance)
  - **Spaced Review Module:** Visually adjacent as a distinct consolidation item when due. It is clearly separated from the 4-stage linear path.

### 8.5 Qualifications Scotland Specification Alignment
- Specification mapping appears as **precise academic reference material**.
- Answers: *"What does the Scottish qualification expect me to know here?"*
- Uses real mapped curriculum specification codes from the repository when available.
- Avoids implying official state endorsement, regulatory bureaucracy, or institutional accreditation.
- Non-affiliation notices remain quiet and editorial. Does not overpower the student's active learning pathway.

### 8.6 Notes / Editorial Lesson Reader
- **Typography-First Layout:** Constrained reading column (max-width `72ch` to `80ch`) with an on-page sticky table of contents (`On this page: What differentiation does, The power rule, Gradient at a point, Quick self-check`).
- **Authored Pedagogical Blocks:**
  - **Fundamental Definition Callout:** Pure white background, navy left accent border, formal KaTeX limit definition.
  - **Core Formula Rule:** Clean comparison table contrasting standard monomial with scaled coefficient derivations.
  - **Worked Examples:** Step-by-step boxed derivation with clear step labels and evaluated results.
  - **Exam Trap Warning:** Warm amber callout box highlighting frequent student mistakes (e.g., *Substituting into original f(x) yields y, not the gradient m*).
  - **Quick Self-Check:** Interactive disclosure card allowing learners to attempt a comprehension question before advancing.
  - **Stage Completion Footer:** Direct CTA to launch Stage 02: `Test your power rule fluency → Continue to Foundations`.

### 8.7 Question Workspace (Focus Mode)
- **Zero Distraction Canvas:** Navigation chrome recedes. Breadcrumb and formula sheet drawer remain accessible at top right.
- **Unanswered State:**
  - Clear stage indicator: e.g., `CURRENT STAGE · Foundations`.
  - Prominent question stem with clean KaTeX.
  - Dedicated input field with clear mathematical focus state.
  - Accessible tools: `Need a hand? Show hint` and `Formula sheet`.
  - Primary button: Solid deep navy `Submit Answer`.
- **Marked & Answered State:**
  - Semantic feedback banner:
    - If correct: Soft green background (`bg-green-50 text-green-900 border border-green-200`) with checkmark.
    - If incorrect: Soft rose background (`bg-red-50 text-red-900 border border-red-200`) with precise correction.
  - Step-by-Step Worked Solution: Fully formatted derivation showing exact method and marks matching Scottish qualification criteria.
  - Primary action advances to next task: `Next Question →`.

---

## 9. Responsive & Mobile Design Principles

Mobile is not desktop squashed into a 390px column.

1. **Navigation:** Desktop left sidebar collapses into a lightweight bottom navigation bar or a clean slide-over drawer with touch targets $\ge 44\text{px}$.
2. **Horizontal Math Overflow:** Display equations must never clip. Wrap mathematical display containers in `overflow-x-auto` with subtle gradient fades on long expressions.
3. **Curriculum Stacking:**
   - 4-Stage Pathway: Adapts from a 4-column horizontal grid to a stacked vertical stepper with active stage highlighted.
   - Enrolled Course Rows: Stack course progress and action buttons vertically while preserving clear visual separation.
4. **Question Workspace on Mobile:** Keep answer controls comfortably reachable without obscuring mathematical content. Do not force fixed bottom keypads unless validated in the real product.
5. **Secondary Rail Collapsing:** On reading surfaces (Notes), table of contents collapses into a sticky jump-menu bar.

---

## 10. Motion & Micro-Interactions

Motion must be **minimal, functional, and purposeful**.

- **Permitted Motion (Functional & Optional):**
  - Subtle accordion expansion/collapse for syllabus sub-skills (duration `200ms`, `ease-out`).
  - Modal appearance and drawer slide (`150ms–200ms`).
  - Micro-hover transitions on interactive rows (`transition-colors duration-150`).
- **Forbidden Motion:**
  - Mandatory progress bar animations on page mount.
  - Bouncing elements, pulsating buttons, floating badges.
  - Confetti, fireworks, or gamified celebration modals on correct answers.
  - Continuous ambient moving backgrounds or looping shaders.
- **Accessibility:** All animations must respect `prefers-reduced-motion: reduce` by setting transition durations to `0ms`.

---

## 11. Explicit Anti-Patterns (The "Never" List)

Any screen containing the following patterns is a **defect**:

1. **Generic SaaS Card Grids:** Boxing every heading, paragraph, and link into identical rounded white rectangles.
2. **Gamification Theatre:** Streaks, flame icons, XP points, coin tallies, leaderboards, motivational quotes, or cartoon mascots.
3. **Institutional & Bureaucratic Roleplay:** Invented candidate IDs, Scottish school division codes, fake accreditation seals, regulatory compliance notices, or university faculty badges.
4. **Synthetic Analytics:** Fake "mastery percentages", retention decay curves, cognitive load graphs, arbitrary "time remaining" timers, or proof counts.
5. **Dark Mode AI Aesthetic:** Glowing neon borders, dark purple/cyan gradients, glassmorphism, or dark console themes.
6. **Excessive Tag & Badge Clutter:** Pill badges on every word. Badges are strictly reserved for state (`In Progress`, `Due for review`, `Active`).
7. **Tiny Learner-Facing Typography:** Shrinking instructional prose to accommodate excess UI chrome.
8. **Monospace Overuse:** Rendering paragraphs or normal labels in monospace.
9. **Duplicating Learner State:** Showing the exact same progress metrics in 4 different places across the page.
10. **Explaining System Mechanics:** Copy explaining algorithm internals (e.g., "Our deterministic spaced retrieval engine utilizes modified SM-2 decay curves"). Tell the student what to study, not how the database works.
11. **Marketing Elements in Workspaces:** Promotional banners, upgrade prompts, or "feature showcase" widgets inside active learning workflows.
12. **Confusing Exam Practice with Past Papers:** Calling Orthic-authored exam questions "official past papers", or presenting official exam past papers inside the authored 4-stage pathway.

---

## 12. Implementation Checklist for Engineers & Agents

Before shipping or approving an Orthic interface:
- [ ] **Hierarchy:** Did you use typography, dividers, and spacing before reaching for a card?
- [ ] **Data Authenticity:** Does every string reflect real Scottish curriculum or genuine student state from the repository?
- [ ] **Awarding Body Language:** Is "Qualifications Scotland" / "Scottish qualifications" used instead of treating SQA as the active awarding body?
- [ ] **Exam Practice vs Past Papers:** Is Exam practice clearly Orthic-authored content, and Past Papers preserved as official historical resources?
- [ ] **Review Distinctness:** Is Review treated as a spaced-review system distinct from the 4 authored stages, with no exposed internal decay mechanics?
- [ ] **Math Rendering:** Is all mathematics rendered via KaTeX with zero raw source strings visible?
- [ ] **Colors:** Is the page predominantly off-white/navy with restrained semantic accents?
- [ ] **Buttons:** Is there exactly one obvious primary navy button in the dominant view?
- [ ] **Confidence:** Is learner confidence represented as a 3-tier self-rating rather than a synthetic percentage?
- [ ] **Pathway:** Are the 4 stages (*Notes*, *Foundations*, *Applications*, *Exam practice*) distinct from *Review*?
- [ ] **Restraint:** Have all fake institutional, regulatory, and gamified elements been deleted?
- [ ] **A11y & Contrast:** Does all text target WCAG AA contrast (minimum 4.5:1 against surfaces) and maintain semantic focus/structure?

*Orthic is calm, precise, and academically serious. Build accordingly.*
