# Account Sync V1

Orthic keeps account-owned Study Plan inputs and learner confidence in the existing account-data boundary.

- Guests use `orthic.studyPlan.v1` and `orthic.confidence.v1` in the current browser as authority.
- Signed-in learners use owner-scoped PostgreSQL rows as authority. The same local keys remain an optimistic cache and offline fallback.
- Anonymous browser state is captured before first account hydration and is uploaded only after the learner explicitly chooses **Add browser setup**.
- Existing account settings and confidence win guest-import conflicts. Guest assessments fill missing semantic records using a separate content fingerprint; their stable IDs do not change when edited.
- Study Plan item changes merge per item and are limited to the current planner version and week during guest import.
- The generated weekly plan is never stored as account authority. Settings, assessments, confidence, overrides, item mutations, current learning evidence and the planner version regenerate it deterministically.
- Review status, Mistake Log, activity summaries and Orthic confidence suggestions remain derived.

The API resolves the authenticated owner server-side, uses the established owner advisory lock and account-active checks, and does not trust an owner ID supplied by the browser. Export and learning-data erasure include every new account-state table.
