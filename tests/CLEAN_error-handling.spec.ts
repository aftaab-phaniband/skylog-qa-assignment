import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Error Handling Tests - Scenario 8
 * 
 * When GET /api/bookings fails, user sees error state with retry button
 */

async function createTestUser(request: APIRequestContext) {
  const response = await request.post('/api/test/user');
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ email: string; password: string }>;
}


test.describe('Error Handling', () => {
  test('Scenario 8: API failure shows error state with retry', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Setup intercept to fail bookings fetch
    await page.route('**/api/bookings', (route) => {
      route.abort('failed');
    });

    // Action: Sign in - will succeed but bookings fetch will fail
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should see error message (not empty table)
    const errorMessage = page.locator('text=could not load').or(page.locator('text=Could not reach the server. Check your connection and try again.'));
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Assert: Should see Retry button
    const retryButton = page.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();

    // Action: Remove intercept and click retry
    await page.unroute('**/api/bookings');
    await retryButton.click();

    // Assert: Error should disappear and bookings should load
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
  });

  test('Error state does not show empty table', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Setup intercept to fail bookings fetch
    await page.route('**/api/bookings', (route) => {
      route.abort('failed');
    });

    // Action: Sign in
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should see error message
    const errorMessage = page.locator('text=could not load').or(page.locator('text=error'));
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Assert: Table should NOT be visible
    const table = page.locator('table');
    await expect(table).not.toBeVisible();
  });

  test('Retry button successfully recovers from error', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Setup intercept to fail first time
    let callCount = 0;
    await page.route('**/api/bookings', (route) => {
      callCount++;
      if (callCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Action: Sign in - first fetch will fail
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should see error
    const errorMessage = page.locator('text=could not load').or(page.locator('text=error'));
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Action: Click Retry
    const retryButton = page.getByRole('button', { name: 'Retry' });
    await retryButton.click();

    // Assert: Should now see bookings
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible({ timeout: 10000 });
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('Search with no results shows different state than error', async ({ page, request }) => {
    // Setup: Create test user and sign in successfully
    const user = await createTestUser(request);
    
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await Promise.all([
      page.waitForURL('/bookings'),
      page.getByRole('button', { name: 'Sign in' }).click()
    ]);

    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    // Action: Search for something that doesn't exist
    const searchBox = page.getByLabel('Search passenger');
    await searchBox.fill('NonExistentPassenger12345');

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Assert: Should show empty state (not error)
    const emptyMessage = page.locator('text=No bookings');
    await expect(emptyMessage).toBeVisible();

    // Assert: Table should not be visible
    const table = page.locator('table');
    await expect(table).not.toBeVisible();

    // Assert: No error message should be shown
    const errorMessage = page.locator('text=could not load').or(page.locator('text=error'));
    await expect(errorMessage).not.toBeVisible();
  });
});
