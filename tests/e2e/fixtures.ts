import type { Page } from "@playwright/test";

export async function mockEmptyServices(page: Page) {
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { authenticated: false, address: null, chainId: null, expiresAt: null } }));
  await page.route("**/api/challenges/current", (route) => route.fulfill({ json: { challenge: null } }));
  await page.route("**/api/challenges/history", (route) => route.fulfill({ json: { challenges: [] } }));
  await page.route("**/api/stats", (route) => route.fulfill({ json: { creations: 0, creators: 0, votes: 0, winners: 0 } }));
  await page.route("**/api/submissions?**", (route) => route.fulfill({ json: { submissions: [] } }));
  await page.route("**/api/results/latest", (route) => route.fulfill({ json: { challenge: null, podium: [] } }));
  await page.route("**/api/echo-chain", (route) => route.fulfill({ json: { nodes: [] } }));
}
