import { expect, test } from "@playwright/test";
import { getDemoPathway, getDemoQuestions, getDemoSkill } from "../lib/demo/content";
import { contentResolver } from "../lib/content-resolver";
import { resolveLessonDocument } from "../lib/lessons/resolver";
import { currentAttempt, QUESTION_IDS, v3Payload } from "./fixtures/progress";
import { submitAnswer, retryAnswer, openHint, openWorkedSolution, expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { WALKTHROUGH_IDS } from "../lib/demo/walkthrough";

const first = getDemoQuestions().find((question) => question.id === WALKTHROUGH_IDS[0])!;
const productionPayload = v3Payload([currentAttempt(QUESTION_IDS[0], 1)]);
const productionKeys = ["orthic.studyPlan.v1", "orthic.confidence.v1", "orthic.learnerPreferences.v1", "orthic.accountStateSync.v1",
  "stemforge.answerDrafts.v1", "stemforge.practiceSessions.v1", "stemforge.pathCelebration.v1", "stemforge.stageCelebration.v1",
  "stemforge.evidenceProvenance.v1", "stemforge.progressImport.v1", "stemforge.progressSync.v1", "orthic.premiumPreview.v1"];

async function assertContained(page: import("@playwright/test").Page) {
  for (const href of await page.locator("a[href]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))) {
    expect(href?.startsWith("#") || href?.startsWith("/demo/") || href === "/demo").toBe(true);
  }
  await expect(page.getByRole("link", { name: /^(?:Account|Premium|Review|Question Bank|Sign in|Sign up|Basic differentiation)$/i })).toHaveCount(0);
}

test("signed-in-like Dashboard, Skill, Notes and reset preserve production state without account requests", async ({ page, context }) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.addCookies([{ name: "sb-test-project-auth-token", value: "simulated-existing-session", url: "http://127.0.0.1:3070" }]);
  await context.route("**/api/**", (route) => {
    apiRequests.push(new URL(route.request().url()).pathname);
    return route.fulfill({ json: { authenticated: true, accountFingerprint: "test-preview-owner", accountGeneration: "1" } });
  });
  await context.route("**/*.supabase.co/**", (route) => { apiRequests.push("auth-service"); return route.abort(); });
  await page.addInitScript(({ keys, progress }) => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify({ sentinel: key }));
    localStorage.setItem("stemforge.localProgress.v1", JSON.stringify(progress));
    sessionStorage.setItem("stemforge:working-context-notes-origin:sentinel", "production-origin");
  }, { keys: productionKeys, progress: productionPayload });
  await page.goto("/demo");
  const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.getByRole("link", { name: "Try Chain Rule" }).click();
  await expect(page.getByTestId("demo-content-count")).toHaveText(["Complete lesson", "10 questions available", "9 questions available", "15 questions available"]);
  await assertContained(page);
  await page.getByRole("link", { name: "Read Notes" }).click();
  const native = resolveLessonDocument(getDemoSkill()!.skillPath)!;
  expect(native.source).toBe("native");
  await expect(page.getByTestId("lesson-document")).toHaveAttribute("data-lesson-id", native.document.lessonId);
  await expect(page.getByRole("link", { name: "Try Foundations" })).toHaveAttribute("href", "/demo/question/" + first.id);
  await assertContained(page);
  await page.getByRole("link", { name: "Back to Chain Rule" }).click();
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(page.getByRole("status")).toHaveText("Preview reset.");
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("real stage workspaces have contained actions and invalid IDs fail closed", async ({ page }) => {
  for (const stage of getDemoPathway().slice(1)) {
    await page.goto(stage.href);
    await expect(page.getByTestId("question-workspace-card")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Answer" })).toBeVisible();
    await assertContained(page);
    await expect(page.getByRole("link", { name: "Explore Chain Rule", exact: true })).toBeVisible();
  }
  const other = contentResolver.getQuestions().find((question) => question.skillPathId !== "chain-rule")!;
  for (const id of [other.id, "physics-1", "not-a-real-question"]) {
    await page.goto("/demo/question/" + id);
    await expect(page.getByRole("heading", { name: "Question unavailable in this demo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Chain Rule" })).toHaveAttribute("href", "/demo/chain-rule");
    await assertContained(page);
  }
});

for (const signedIn of [false, true]) {
  test(`interactive walkthrough isolates attempts, hints and solutions (${signedIn ? "simulated signed-in" : "signed-out"})`, async ({ page, context }, testInfo) => {
    const apiRequests: string[] = []; const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (signedIn) await context.addCookies([{ name: "sb-test-project-auth-token", value: "simulated-existing-session", url: "http://127.0.0.1:3070" }]);
    await page.route("**/api/**", (route) => { apiRequests.push(new URL(route.request().url()).pathname); return route.fulfill({ json: { authenticated: signedIn } }); });
    await page.route("**/*.supabase.co/**", (route) => { apiRequests.push("auth-service"); return route.abort(); });
    await page.addInitScript(({ keys, progress }) => {
      for (const key of keys) { localStorage.setItem(key, JSON.stringify({ sentinel: key })); sessionStorage.setItem(key, "production-session-sentinel"); }
      localStorage.setItem("stemforge.localProgress.v1", JSON.stringify(progress));
    }, { keys: productionKeys, progress: productionPayload });
    await page.goto("/demo/chain-rule/notes");
    const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await page.getByRole("link", { name: "Try Foundations" }).click();
    await expect(page).toHaveURL(new RegExp(first.id + "$"));
    await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
    await submitAnswer(page, "15(3x+2)^4");
    await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: correct");
    await assertContained(page);
    await page.getByRole("link", { name: "Sample Applications", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(WALKTHROUGH_IDS[1] + "$"));
    await expect(page.getByTestId("stage-question-position")).toContainText("in Applications");
    await openHint(page);
    await expect(page.getByTestId("hint-content")).toBeFocused();
    await submitAnswer(page, "2000/2");
    await expect(page.getByRole("heading", { name: "Correct with support" })).toBeVisible();
    await page.getByRole("link", { name: "Sample Exam practice", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(WALKTHROUGH_IDS[2] + "$"));
    await expect(page.getByTestId("stage-question-position")).toContainText("in Exam practice");
    await submitAnswer(page, "1");
    await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: incorrect");
    await openWorkedSolution(page);
    await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: completed with solution");
    await page.screenshot({ path: testInfo.outputPath("interactive-workspace-desktop.png"), fullPage: true });
    await assertContained(page);
    await page.getByRole("link", { name: "Return to Preview Dashboard", exact: true }).click();
    const activity = page.getByTestId("preview-activity");
    await expect(activity.locator("li")).toHaveCount(3);
    await expect(activity).toContainText("Correct independently");
    await expect(activity).toContainText("Correct with hint");
    await expect(activity).toContainText("Solution used");
    await expect(page.getByRole("link", { name: "Continue Chain Rule" })).toHaveAttribute("href", "/demo/chain-rule");
    await page.screenshot({ path: testInfo.outputPath("genuine-preview-activity.png"), fullPage: true });
    expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
    await page.getByRole("button", { name: "Reset preview" }).click();
    await expect(activity).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Try Chain Rule" })).toBeVisible();
    expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
    expect(apiRequests).toEqual([]); expect(errors).toEqual([]);
  });
}

test("preview reset and refresh discard drafts, attempts and support without leaving the Workspace", async ({ page }) => {
  await page.goto("/demo/question/" + first.id);
  await openHint(page);
  await submitAnswer(page, "1");
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expect(page.getByTestId("question-status")).toHaveCount(0);
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await expect(page.getByTestId("rich-math-field")).toHaveJSProperty("value", "");
  await submitAnswer(page, "15(3x+2)^4");
  await page.reload();
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await expect(page.getByTestId("question-completion-status")).toContainText("not yet been completed");
  await expect(page.getByTestId("rich-math-field")).toHaveJSProperty("value", "");
});

test("demo malformed/unsupported input is not an incorrect result and genuine error can recover", async ({ page }) => {
  await page.goto("/demo/question/" + first.id);
  await submitAnswer(page, "15x^");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: format warning");
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await submitAnswer(page, "y=1");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: not marked");
  await submitAnswer(page, "1");
  await retryAnswer(page, "15(3x+2)^4");
  await page.getByRole("link", { name: "Preview overview", exact: true }).click();
  await expect(page.getByTestId("preview-activity")).toContainText("Correct after error");
});

test("production and preview tabs retain separate progress", async ({ page, context }) => {
  await context.route("**/api/**", (route) => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/question/" + QUESTION_IDS[2]);
  await submitAnswer(page, "14");
  const before = await page.evaluate(() => localStorage.getItem("stemforge.localProgress.v1"));
  const demo = await context.newPage();
  await demo.goto("/demo/question/" + first.id);
  await submitAnswer(demo, "15(3x+2)^4");
  expect(await page.evaluate(() => localStorage.getItem("stemforge.localProgress.v1"))).toEqual(before);
  await page.reload();
  await expect(page.getByTestId("question-completion-status")).toContainText("has been completed");
  await demo.getByRole("button", { name: "Reset preview" }).click();
  expect(await page.evaluate(() => localStorage.getItem("stemforge.localProgress.v1"))).toEqual(before);
});

test("full skill exploration exposes all 34 canonical questions without fake stage completion", async ({ page }) => {
  await page.goto("/demo/chain-rule");
  for (const label of ["Foundations · 10 questions", "Applications · 9 questions", "Exam practice · 15 questions"]) {
    await page.getByText(label, { exact: true }).click();
  }
  const exploration = page.locator('section[aria-labelledby="explore-chain-rule"]');
  await expect(exploration.locator("ol a")).toHaveCount(34);
  const destinations = await exploration.locator("ol a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(destinations)).toEqual(new Set(getDemoQuestions().map((question) => "/demo/question/" + question.id)));
  await assertContained(page);
});

test("closed-vocabulary written Chain Rule question uses its real marker rather than a fake self-check", async ({ page }) => {
  await page.goto("/demo/question/hm-calc-diff-chain-ppq-017");
  const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.getByRole("textbox", { name: "Your answer" }).fill("I differentiated the outer bracket, then the inner expression.");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByRole("status", { name: "Answer feedback: incorrect" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Unsure" })).toHaveCount(0);
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("textbox", { name: "Your answer" }).fill("C1");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByRole("status", { name: "Answer feedback: correct" })).toBeVisible();
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(page.getByTestId("question-completion-status")).toContainText("not yet been completed");
});

for (const [width, height] of [[390, 812], [375, 812], [320, 700]]) {
  test(`interactive mobile walkthrough, input, support and feedback at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/question/" + first.id);
    await page.getByRole("button", { name: "Show maths keyboard" }).click();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("maths-keyboard-" + width + ".png"), fullPage: true });
    await page.getByRole("button", { name: "Hide maths keyboard" }).click();
    const field = page.getByLabel("Your answer");
    await field.focus();
    await expect(field).toBeFocused();
    await field.pressSequentially("15(3x+2)^4", { delay: 30 });
    await expect(field).toBeFocused();
    await field.press("Enter");
    await expect(page.getByRole("heading", { name: "Correct", exact: true, level: 2 })).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: "Sample Applications", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(WALKTHROUGH_IDS[1] + "$"));
    await expect(page.getByTestId("stage-question-position")).toContainText("in Applications");
    await openHint(page); await submitAnswer(page, "1000");
    await page.getByRole("link", { name: "Sample Exam practice", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(WALKTHROUGH_IDS[2] + "$"));
    await expect(page.getByTestId("stage-question-position")).toContainText("in Exam practice");
    await submitAnswer(page, "1"); await openWorkedSolution(page);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("solution-feedback-" + width + ".png"), fullPage: true });
    await page.getByRole("link", { name: "Return to Preview Dashboard", exact: true }).click();
    await expect(page.getByTestId("preview-activity").locator("li")).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
  });
}

test("signed-in and signed-out visitors see the same preview shell", async ({ browser }) => {
  const guest = await browser.newContext();
  const signed = await browser.newContext();
  await signed.addCookies([{ name: "sb-test-project-auth-token", value: "simulated-existing-session", url: "http://127.0.0.1:3070" }]);
  const snapshots = [];
  for (const context of [guest, signed]) {
    const page = await context.newPage();
    await page.goto("/demo");
    await expect(page.getByRole("link", { name: "Try Chain Rule" })).toBeVisible();
    snapshots.push(await page.getByTestId("demo-shell").innerText());
  }
  expect(snapshots[0]).toEqual(snapshots[1]);
  await guest.close(); await signed.close();
});

for (const [width, height] of [[1440, 900], [1024, 900], [390, 812], [375, 812], [320, 700]]) {
  test("preview composition, focus, reduced motion and Notes remain usable at " + width + "px", async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    for (const [route, name] of [["/demo", "overview"], ["/demo/chain-rule", "skill"], ["/demo/chain-rule/notes", "notes"]]) {
      await page.goto(route);
      await expect(page.locator("main#main-content")).toBeVisible();
      await assertContained(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const reset = page.getByRole("button", { name: "Reset preview" });
      const box = await reset.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      if (name !== "notes") {
        const steps = page.getByTestId("demo-pathway").last().locator(":scope > li");
        await expect(steps).toHaveCount(4);
        const firstBox = await steps.nth(0).boundingBox(); const lastBox = await steps.nth(3).boundingBox();
        if (width < 768) expect(lastBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
        else expect(Math.abs(lastBox!.y - firstBox!.y)).toBeLessThan(2);
      } else await expect(page.locator(".katex").first()).toBeVisible();
      await page.mouse.move(0, 0);
      await page.screenshot({ path: testInfo.outputPath(name + "-" + width + ".png"), fullPage: true, animations: "disabled" });
    }
    await page.goto("/demo");
    const action = page.getByRole("link", { name: "Try Chain Rule" });
    await action.focus();
    await expect(action).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await action.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
    expect(await action.locator(".orthic-arrow").evaluate((node) => getComputedStyle(node).transform)).toBe("none");
    await action.press("Enter");
    await expect(page).toHaveURL(/\/demo\/chain-rule$/);
  });
}

test("ordinary Question Workspace still records evidence in the unchanged production repository", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ json: { authenticated: false } }));
  await page.goto(`/question/${QUESTION_IDS[2]}`);
  await expect(page.getByTestId("question-workspace-card")).toBeVisible();
  await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("14");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByRole("status", { name: "Answer feedback: correct", exact: true })).toBeVisible();
  const recorded = await page.evaluate(() => JSON.parse(localStorage.getItem("stemforge.localProgress.v1")!).data.attempts);
  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toMatchObject({ questionId: QUESTION_IDS[2], answer: "14", isCorrect: true, skillPathId: "basic-differentiation" });
});
