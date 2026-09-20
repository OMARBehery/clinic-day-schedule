import { test, expect } from "@playwright/test";

test("staff can list, conflict, and open the seeded scan", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Appointment board" })).toBeVisible();

  const names = page.getByText("Nora El-Sayed");
  await expect(names.first()).toBeVisible();

  await page.getByRole("button", { name: "New appointment" }).click();
  await page.getByLabel("Patient name").fill("Conflict Probe");
  await page.getByLabel("Doctor").selectOption({ label: "Dr. Amira Hassan" });
  await page.getByLabel("Start time").fill("09:00");
  await page.getByRole("button", { name: "Create appointment" }).click();

  await expect(page.getByRole("alert")).toContainText(/overlaps/i);
  await expect(page.getByLabel("Patient name")).toHaveValue("Conflict Probe");

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "View scan" }).first().click();
  await expect(page.getByRole("heading", { name: "Imaging study" })).toBeVisible();
  await expect(page.getByText("Modality")).toBeVisible();
});
