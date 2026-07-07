$message = @"
STEM Forge reminder:

Product improvement backlog:
- Add estimated completion times for stages.
- Add exam weighting for spec areas.
- Make the question page more interactive.
- Make Recommended Next data-driven.

Immediate next build priorities:
1. Real navigation: Subjects -> Higher Physics -> Our Dynamic Universe -> Motion -> Foundations -> Question 1.
2. Data structure: create questions.ts with id, subject, courseArea, specArea, stage, difficulty, marks, question, answer, solution, commonMistake.
3. Build one complete topic only: Motion - equations and graphs, with 5 Foundations, 5 Applications, 5 Past Paper Questions.
4. Load questions dynamically from questions.ts instead of hardcoding.
"@

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show($message, "STEM Forge priorities", "OK", "Information") | Out-Null
