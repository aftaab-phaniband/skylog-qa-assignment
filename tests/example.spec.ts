import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * A single worked example so you can see the shape we expect, and confirm your
 * setup works before you start. Feel free to delete, move or restructure it.
 *
 * Note what it does NOT do: no waitForTimeout, no XPath, and it creates its own
 * user rather than sharing the demo account with every other test.
 */

/** Creates an isolated account with the standard 12 seeded bookings. */
async function createTestUser(request: APIRequestContext) {
  const response = await request.post('/api/test/user');
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ email: string; password: string }>;
}

test('a user can sign in and see their bookings', async ({ page, request }) => {
  const user = await createTestUser(request);

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // The list is fetched asynchronously. The assertion retries until the
  // heading appears, so no explicit wait is needed.
  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
  await expect(page.getByTestId('summary-total')).toHaveText('12');

  // Five rows per page.
  await expect(page.getByTestId('booking-row')).toHaveCount(5);
});
