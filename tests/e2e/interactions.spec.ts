import { expect, test } from "@playwright/test";
import { mockEmptyServices } from "./fixtures";

const routes = [
  ["HOME", "/"], ["CREATE", "/create"], ["GALLERY", "/gallery"], ["VOTE", "/vote"],
  ["REVEAL", "/reveal"], ["ECHO CHAIN", "/echo-chain"], ["PROFILE", "/profile"], ["DOCS", "/docs"],
] as const;

test.beforeEach(async ({ page }) => mockEmptyServices(page));

test("desktop navigation, active state and home CTAs perform real routing", async ({ page }, testInfo) => {
  await page.goto("/");
  await Promise.all([page.waitForURL(/\/create$/), page.getByRole("link", { name: "ENTER CHALLENGE" }).click()]);
  if (testInfo.project.name !== "desktop") return;
  await page.getByRole("link", { name: "ECHO MARKET" }).click();
  await Promise.all([page.waitForURL(/\/gallery$/), page.getByRole("link", { name: "EXPLORE GALLERY" }).click()]);
  for (const [name, path] of routes) {
    const target = new RegExp(`${path === "/" ? "/$" : `${path}$`}`);
    await Promise.all([page.waitForURL(target), page.getByRole("link", { name, exact: true }).click()]);
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
  }
});

test("gallery tabs change the real request query and expose selected feedback", async ({ page }) => {
  const requested: string[] = [];
  await page.route("**/api/submissions?**", async (route) => { requested.push(route.request().url()); await route.fulfill({ json: { submissions: [] } }); });
  await page.goto("/gallery");
  for (const name of ["HISTORY", "LATEST", "CURRENT CHALLENGE"]) {
    const tab = page.getByRole("tab", { name });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
  expect(requested.some((url) => url.includes("mode=history"))).toBeTruthy();
  expect(requested.some((url) => url.includes("mode=latest"))).toBeTruthy();
});

test("API 500 displays error feedback and Retry makes a new request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/submissions?**", async (route) => { calls += 1; await route.fulfill({ status: 500, json: { error: "SERVICE_UNAVAILABLE" } }); });
  await page.goto("/gallery");
  await expect(page.getByText("The gallery could not be loaded.")).toBeVisible();
  await page.getByRole("button", { name: /try again/i }).click();
  await expect.poll(() => calls).toBeGreaterThan(1);
});

test("create and vote show honest wallet-required states", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("button", { name: /CONNECT WALLET TO CREATE/ })).toBeDisabled();
  await expect(page.getByText(/Use CONNECT & SIGN IN/)).toBeVisible();
  await page.goto("/vote");
  await expect(page.getByText(/Connect and sign in to check challenge phase/)).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "CONNECT WALLET" })).toBeVisible();
});

test("keyboard users can reach controls and activate a CTA", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name !== "desktop") {
    const toggle = page.getByRole("button", { name: "Toggle menu" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    return;
  }
  let activated = false;
  for (let index = 0; index < 20; index++) {
    await page.keyboard.press("Tab");
    if (await page.getByRole("link", { name: "ENTER CHALLENGE" }).evaluate((node) => node === document.activeElement)) { activated = true; break; }
  }
  expect(activated).toBeTruthy();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/create$/);
});

test("mobile menu opens, closes with Escape, routes, and pages do not overflow", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "mobile") {
    for (const [, path] of routes) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeFalsy();
    }
    return;
  }
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle menu" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  for (const [, path] of routes) {
    await toggle.click();
    const link = page.locator("#mobile-navigation").getByRole("link", { name: routes.find((item) => item[1] === path)![0], exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : `${path}$`}`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeFalsy();
  }
});
