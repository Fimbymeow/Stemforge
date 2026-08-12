# Alpha Session A — Unassisted First Use

Guest-only. Requires nothing from the production database — safe to run regardless of the production database's current state. Approximate duration: 25–35 minutes. Hypothesis definitions and evidence-required detail: `STEM_FORGE_ALPHA_READINESS.md` §4. Evidence sheet: `docs/alpha-evidence-capture.md`.

Setup: fresh private/incognito browser window or a clean profile, before the learner sits down. Do not narrate what Orthic is beforehand.

## A1 — Fresh start

- **Say:** "This is a website called Orthic. Take a look and tell me what you think it's for. Talk out loud as you go — there's no wrong answer."
- **Do not explain:** what Orthic is, who it's for, or that it's a maths product.
- **Record:** time to first verbal guess; exact words used; whether the beta/scope notice is read or skipped.
- **Done when:** learner states an interpretation, correct or not, within 30 seconds (H1).
- **If blocked:** silent past 30 seconds — ask "What's the first thing you notice?"; do not supply the answer.

## A2 — Reach Basic Differentiation

- **Say:** "Find your way to an actual maths question you could try."
- **Do not explain:** the navigation path, that Higher Physics is locked, or that only one subject/path is active.
- **Record:** exact click path; any dead ends; time to first question.
- **Done when:** learner reaches a real Basic Differentiation question unaided (H2).
- **If blocked:** after two minutes stuck, give the smallest possible nudge ("what would you click to start learning?"); record that a hint was needed — a concern-level H2 signal, not a failure if they recover.

## A3 — Submit an incorrect answer

- **Say:** "Try answering this one — if you're not sure, just give it your best guess."
- **Do not explain:** the expected input format, or that the answer is likely wrong.
- **Record:** whether the field is understood as the answer input; reaction to the incorrect-feedback state; any confusion about whether it was accepted at all.
- **Done when:** learner can state, unprompted, whether their answer was marked right or wrong (H3).
- **If blocked:** ask "what do you think happened when you submitted that?" before explaining.

## A4 — Use a hint, then answer correctly

- **Say:** "There's a hint available on this one — try using it, then have another go."
- **Do not explain:** what the hint says or whether using it "costs" anything.
- **Record:** whether the hint is read fully before re-attempting; whether the subsequent answer is correct; direct reaction ("was that helpful?").
- **Done when:** learner reaches a correct, hint-assisted outcome and can describe whether the hint helped (H4).
- **If blocked:** still incorrect after the hint — let them try the worked solution next rather than intervening; this is itself valid solution-assisted evidence.

## A5 — Deliberately trigger a worked solution

- **Say:** "This time, after you've had a genuine go, open the worked solution and read it through."
- **Setup:** choose a new question; let the learner submit one genuine attempt first — the solution is gated behind a genuine attempt.
- **Do not explain:** why the solution wasn't available before their attempt.
- **Record:** whether the gating is noticed or confusing; whether the solution is described as clear or hard to follow.
- **Done when:** learner reads the full worked solution and gives a clear helpful/unhelpful judgement (H4).
- **If blocked:** if they try to open the solution before attempting and it's unavailable, let them discover why themselves before explaining.

## A6 — Complete enough of the path to see status language

- **Say:** "Keep going a little further. What does that badge/label mean to you?"
- **Setup:** let the learner continue answering (mix of independent/hint/solution-assisted) until at least one status badge appears.
- **Do not explain:** the Completed/Secure/Mastered distinction or the mastery threshold.
- **Record:** the learner's own words for each status they encounter.
- **Done when:** learner distinguishes at least two of the three tiers correctly in their own words (H5).
- **If blocked:** if only "Completed" has appeared by the time budget runs out, ask them to describe just that one rather than forcing further progress.

## A7 — Dashboard / next-action comprehension

- **Say:** "Looking at this page, what would you do next if you came back tomorrow?"
- **Setup:** navigate (or have the learner navigate) to the dashboard.
- **Do not explain:** what the dashboard's recommendation is pointing at.
- **Record:** whether their stated next action matches the dashboard's actual primary recommendation.
- **Done when:** learner states a plausible, specific next action (H8).
- **If blocked:** if they say "I don't know," ask them to point at whatever on the page looks most like an instruction, rather than telling them where to look.

## A8 — Explicit feedback

- **Say:** "If you wanted to tell whoever made this something — a bug, an idea, anything — how would you do that?"
- **Do not explain:** where the feedback control is.
- **Record:** whether it's found unprompted; content and specificity of the message; whether the submission is confirmed as accepted or fails.
- **Done when:** learner finds the control and composes a specific, actionable message (H10); server-side acceptance is a separate, infrastructure-dependent check.
- **If blocked:** not found within a minute — point at the general area (not the exact control) and note this as a discoverability concern.
