import { expect, test } from '@playwright/test';
test('renders auth screen and allows navigation to register', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
});
