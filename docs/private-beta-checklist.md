# Private Beta Checklist

Use this before inviting each small group of testers.

## Routes To Test

- `/`
- `/dashboard`
- `/subjects`
- `/subjects/higher-maths`
- `/subjects/higher-maths/calculus/differentiation/basic-differentiation`
- `/question/hm-calc-diff-basic-f-001`
- `/subjects/higher-maths/question-bank`
- `/subjects/higher-maths/revision-notes`
- `/subjects/higher-maths/formula-cards`
- `/subjects/higher-maths/worked-examples`
- `/subjects/higher-maths/flashcards`
- `/subjects/higher-physics`
- `/resources`
- an unknown route, for example `/not-real-route`

## Core User Journey

1. Land on the homepage and understand what STEM Forge does.
2. Open the dashboard.
3. Go to Subjects, then Higher Maths.
4. Open Basic differentiation.
5. Start a Foundations question.
6. Submit one correct answer and one incorrect answer.
7. Read feedback, hint, worked solution and common mistake.
8. Move to the next question.
9. Return to the dashboard and confirm progress updated.
10. Reset local progress and confirm the dashboard/path return to zero.

## Mobile / iOS Safari Checks

- No horizontal scrolling on homepage, dashboard, path page, question workspace, question bank or resource pages.
- Buttons are not cramped or clipped.
- Question input and maths keypad are usable with the on-screen keyboard.
- Cards stack cleanly and text remains readable.

## Local Progress Checks

- New browser/private window starts with no progress.
- Correct and incorrect attempts both count as attempted.
- Refreshing keeps progress in the same browser.
- Reset local progress clears only this browser.
- Copy stays honest: local progress only, saved on this browser, no account needed.

## Answer Input Checks

- Extra spaces are ignored.
- `*` multiplication works where accepted answers allow it.
- `^` powers work, for example `5x^4`.
- Superscript inputs such as `x²` should not break marking where relevant.
- Wrong but similar answers show feedback and worked solution.

## Locked Higher Physics Checks

- Higher Physics remains visible.
- It is clearly locked / coming soon.
- It does not show fake active progress.
- It points students back to the Higher Maths beta path where appropriate.

## Public Tester URL / Access

- Confirm the deployed URL opens without Vercel login.
- Confirm deployment protection is off for testers.
- Confirm no authentication or invite-only flow is required.

## Feedback Questions For Testers

- What did you think STEM Forge was for within the first 30 seconds?
- Could you find the first question without help?
- Was entering an answer clear?
- Was the worked solution easy to understand?
- Did the progress behaviour make sense?
- What felt confusing, slow or unnecessary?

## Known Limitations

- Higher Maths Basic differentiation is the only active path.
- Higher Physics is locked / coming soon.
- Progress is local to the browser only.
- No accounts, cloud sync, database, payments, AI marking or analytics.
- Future skill paths still need dynamic route support before scaling content.
