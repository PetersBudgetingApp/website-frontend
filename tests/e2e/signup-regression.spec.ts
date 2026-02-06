import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function mockSignupDashboardApi(page: Page) {
  const nowIso = new Date().toISOString();

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/auth/register') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'access-token-1',
          refreshToken: 'refresh-token-1',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 1,
            email: 'newuser@example.com',
          },
        }),
      });
      return;
    }

    if (path.endsWith('/accounts/summary') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalAssets: 0,
          totalLiabilities: 0,
          netWorth: 0,
          accounts: [],
        }),
      });
      return;
    }

    if (path.endsWith('/analytics/cashflow') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          startDate: nowIso.slice(0, 10),
          endDate: nowIso.slice(0, 10),
          totalIncome: 0,
          totalExpenses: 0,
          totalTransfers: 0,
          netCashFlow: 0,
          savingsRate: 0,
        }),
      });
      return;
    }

    if (path.endsWith('/analytics/spending') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSpending: 0,
          categories: [],
        }),
      });
      return;
    }

    if (path.endsWith('/categories') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled mocked endpoint: ${method} ${path}` }),
    });
  });
}

test('signup redirects to dashboard without runtime update-depth crash', async ({ page }) => {
  await mockSignupDashboardApi(page);

  await page.goto('/register');
  await page.locator('#email').fill('newuser@example.com');
  await page.locator('#password').fill('superpass123');
  await page.locator('#confirm-password').fill('superpass123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
});
