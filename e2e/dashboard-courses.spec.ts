import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("Dashboard keeps canonical Higher Maths access in Continue Learning without restoring a course block", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-courses-section")).toHaveCount(0);
  const courseAccess = page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "View Higher Maths" });
  await expect(courseAccess).toHaveAttribute("href", "/subjects/higher-maths");
  await courseAccess.focus();
  await expect(courseAccess).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/subjects\/higher-maths$/);
  await expectNoHorizontalOverflow(page);
});
