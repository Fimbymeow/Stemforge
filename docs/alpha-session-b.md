# Alpha Session B — Account and Cross-Device Continuity

Same day as Session A, or a later return. Hypothesis definitions: `STEM_FORGE_ALPHA_READINESS.md` §4. Evidence sheet: `docs/alpha-evidence-capture.md`. Test-account preparation: `docs/alpha-disposable-accounts.md`.

**Entry gate — check before every Session B, not just once:** confirm `GET https://stemforge-6an8.vercel.app/api/health/ready` currently reports every category `ok`. Do not run Session B against a known-broken backend — a technical failure there is indistinguishable from a real comprehension failure and pollutes the evidence.

## B1 — Establish genuine guest progress

- **Say:** "Before we look at accounts, answer a couple more questions here as a guest, same as before."
- **Setup:** either continue directly from Session A's browser, or have the learner complete 2–3 real questions guest-only first.
- **Record:** exact progress state (question IDs, completion count) reached — this is the reference value B4/B7 must match.
- **Done when:** at least one genuine graded attempt exists in this browser.

## B2 — Create or sign into a permitted test account

- **Say:** "You can optionally create an account. Here's an email to use for this test — try setting one up."
- **Use:** only a facilitator-provisioned disposable test email (`docs/alpha-disposable-accounts.md`) — never the learner's real email.
- **Do not explain:** what having an account will do to their existing progress.
- **Record:** whether the "account is optional" framing is understood before they proceed; any hesitation or expectation-setting questions asked.
- **Done when:** account created/signed in successfully.
- **If it fails:** capture the exact error shown, treat as a **technical failure** (not a comprehension finding), and stop this learner's Session B — do not retry against a possibly-broken backend mid-session.

## B3 — Explicit import decision

- **Say:** "The app has noticed you have progress on this browser. Read what it's offering, and decide what you want to do."
- **Setup:** let the account page's own import prompt appear naturally; do not click anything for the learner.
- **Do not explain:** what "import" means or what happens if they decline.
- **Record:** whether they read the confirmation before acting; their own explanation of what import will do; whether they realise it's optional (H6).
- **Done when:** learner makes and states an explicit, informed choice before confirming.

## B4 — Confirm import result

- **Say:** "Check — does the progress you see now match what you had before?"
- **Do not explain:** whether it succeeded — let them check.
- **Record:** whether the accepted/already-present/conflict result is understandable from the UI alone; whether local guest evidence visibly remained.
- **Done when:** learner confirms the progress total matches B1's reference value.
- **If it fails:** a mismatch is **Critical** — stop and record in full before continuing.

## B5 — Enable synchronization explicitly

- **Say:** "There's a separate setting for keeping this in sync across devices. Find it and decide whether to turn it on."
- **Setup:** do not pre-enable anything; sync must remain off until the learner acts.
- **Do not explain:** where the control is, or that it's different from import.
- **Record:** whether the learner distinguishes "I already imported" from "now it will stay in sync."
- **Done when:** sync is explicitly enabled by the learner's own action, and they can articulate the difference from import.
- **If confused:** conflating import and sync is a Medium comprehension finding, not a blocker.

## B6 — Safe sign-out

- **Say:** "Now sign out. Notice there are two different options — pick the one that keeps your progress on this browser."
- **Do not explain:** the difference between the two options.
- **Record:** whether the correct option is identified without help; the exact wording that helped or didn't.
- **Done when:** learner signs out using "keep progress on this browser" and correctly predicts that local evidence will remain.
- **If the wrong option is chosen:** let it complete (it's non-destructive to remote evidence), then discuss afterward — do not intervene mid-choice.

## B7 — Return on another browser/device

- **Say:** "Sign into the same account here. What do you expect to see?"
- **Setup:** hand the learner a second device or a genuinely separate browser (not just a new tab).
- **Do not explain:** what will or won't be there.
- **Record:** their stated expectation before signing in, then the actual result; whether the match/mismatch is noticed unprompted; explicit trust statement (H7).
- **Done when:** the same evidence from B1–B4 appears, and the learner states they trust it.
- **If it fails:** missing/incorrect evidence is **Critical** — capture both device states in full before any retry.
