# Orthic Alpha Facilitator Briefing

Programme 6 — Alpha Preparation and Real Learner Validation.

This is the entry point to the Alpha facilitator package. It does not repeat the repository evidence, hypotheses, severity rubric, or entry/exit criteria — those live once, authoritatively, in [`STEM_FORGE_ALPHA_READINESS.md`](../STEM_FORGE_ALPHA_READINESS.md), and every asset below cross-references it rather than duplicating it.

## Asset index

| File | Use |
|---|---|
| `docs/alpha-session-a.md` | Task cards for unassisted first use (guest-only) |
| `docs/alpha-session-b.md` | Task cards for account and cross-device continuity |
| `docs/alpha-session-c.md` | Task cards for scheduled Review return |
| `docs/alpha-recruitment-and-consent.md` | Recruitment message, screening questions, consent script |
| `docs/alpha-evidence-capture.md` | Per-task and compact session record sheets |
| `docs/alpha-disposable-accounts.md` | Test-account preparation checklist for Session B |
| `docs/alpha-device-allocation.md` | Device/browser/accessibility roster |
| `docs/alpha-scheduling-plan.md` | Day-by-day plan honouring the two-day Review gap |
| `docs/alpha-go-no-go-record.md` | Fillable final decision record |

This package extends, and does not replace, the existing private-beta material: `docs/private-beta-checklist.md` and `docs/private-beta-feedback-template.md` remain valid and are reused directly for Session A's route/journey checks and reusable tester questions. `docs/private-beta-operations-runbook.md` remains the authoritative description of the in-app feedback mechanism referenced throughout Session A/B/C.

## How to use this kit

1. Complete `docs/alpha-disposable-accounts.md` in full before the first Session B invitation goes out.
2. Complete `docs/alpha-recruitment-and-consent.md`'s screening and consent steps before any learner sits down.
3. Print or duplicate `docs/alpha-session-a.md`, `-b.md`, `-c.md` once per relevant session, one set per learner.
4. Carry `docs/alpha-evidence-capture.md`'s compact sheet into every session; expand to the per-task sheet the moment a Medium-or-above finding occurs.
5. Follow `docs/alpha-device-allocation.md` when assigning participants to devices/browsers, and `docs/alpha-scheduling-plan.md` when booking sessions — Session C cannot be brought forward for a real learner (see the two-day Review requirement in `STEM_FORGE_ALPHA_READINESS.md` §2).
6. Complete `docs/alpha-go-no-go-record.md` only once every recruited learner's applicable sessions are done or explicitly marked incomplete — do not skip it even if every session appeared to go well.

## Rules that apply across every session

- **Never explain what a task card says not to explain**, even if the learner seems stuck — use only the card's own recovery procedure.
- **Never coach toward a specific answer or outcome.** A wrong answer, a missed hint, or an unused worked solution is valid evidence, not a session failure.
- **Never fake the Review scheduler** by editing clocks or local/remote data for a real learner session (`STEM_FORGE_ALPHA_READINESS.md` §2). A separate, clearly-labelled developer-only fixture may exercise the scheduler mechanism itself; it is never presented as learner evidence.
- **Never use a learner's real email, password, or personal data** anywhere in the product during a session — see `docs/alpha-disposable-accounts.md` and `docs/alpha-recruitment-and-consent.md`.
- **Record observed behaviour, learner quotation, and facilitator interpretation as three separate fields**, never merged — see `docs/alpha-evidence-capture.md`.
- **Any Critical finding stops that learner's remaining tasks immediately** — see the severity rubric in `STEM_FORGE_ALPHA_READINESS.md` §5.
- **Do not expand scope.** This package covers exactly the three sessions and the assets above. Graph Engine work, dashboard redesign, new content, Premium/payments/analytics/AI/CMS work is out of scope for Programme 6 regardless of what a session surfaces — findings that suggest such work are recorded for a later, separately-scoped decision, not acted on mid-Alpha.
