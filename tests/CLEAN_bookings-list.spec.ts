import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Bookings List Tests - Scenarios 4-5
 * 
 * 4. Bookings list loads with correct summary figures
 * 5. Filtering by status shows only matching bookings
 */

async function createTestUser(request: APIRequestContext) {
  const response = await request.post('/api/test/user');
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ email: string; password: string }>;
}

async function signIn(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  await Promise.all([
    page.waitForURL('/bookings'),
    page.getByRole('button', { name: 'Sign in' }).click()
  ]);

  // Wait for bookings to load
  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
}

test.describe('Bookings List', () => {
  test('Scenario 4: Bookings list loads with correct summary and rows', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Assert: Page heading is visible
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    // Assert: Summary cards show correct data
    await page.waitForTimeout(10000)
    // New account has: 12 total, 7 confirmed, 30 seats
    await expect(page.getByTestId('summary-total')).toHaveText('12'); // Total bookings
    await expect(page.getByTestId('summary-confirmed')).toHaveText('7')  // Confirmed
    await expect(page.getByTestId('summary-seats')).toHaveText('30'); // Total seats

    // Assert: Table has rows (5 per page)
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);

    // Assert: Pagination shows correct info
    await expect(page.locator('text=Page 1')).toBeVisible();
    
    // Assert: Previous button is disabled on first page
    const prevButton = page.getByRole('button', { name: 'Previous' });
    await expect(prevButton).toBeDisabled();

    // Assert: Next button is enabled
    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeEnabled();
  });

  test('Scenario 5: Filtering by status shows only matching bookings', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Filter by "Confirmed" status
    const statusFilter = page.getByLabel('Status');
    await statusFilter.selectOption('Confirmed');


    // Assert: Should show confirmed bookings (7 total, so 5 on first page)
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);

    // Action: Filter by "Pending" status
    await statusFilter.selectOption('Pending');

    // Wait for filter to apply
    // Assert: Should show pending bookings (3 total)
    await expect(rows).toHaveCount(3);

    // Action: Filter by "Cancelled" status
    await statusFilter.selectOption('Cancelled');

    // Wait for filter to apply

    // Assert: Should show cancelled bookings (2 total)
    await expect(rows).toHaveCount(2);

    // Action: Reset to "All"
    await statusFilter.selectOption('All');

    // Wait for filter to apply

    // Assert: Should show all bookings again
    await expect(rows).toHaveCount(5); // First page of all
  });

  test('Search by passenger name filters results', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Search for "Priya"
    const searchBox = page.getByLabel('Search passenger');
    await searchBox.fill('Priya');

    // Wait for search to apply
  

    // Assert: Should find matching bookings
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toContainText('Priya');

    // Action: Clear search
    await searchBox.clear();

    // Wait for search to clear
    

    // Assert: Should show all bookings again
    await expect(rows).toHaveCount(5);
  });

  test('Pagination navigation works correctly', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Assert: Start on page 1
    await expect(page.locator('text=Page 1')).toBeVisible();

    // Action: Click Next to go to page 2
    const nextButton = page.getByRole('button', { name: 'Next' });
    await nextButton.click();

    // Wait for page change
    

    // Assert: Now on page 2
    await expect(page.locator('text=Page 2')).toBeVisible();

    // Assert: Previous button is now enabled
    const prevButton = page.getByRole('button', { name: 'Previous' });
    await expect(prevButton).toBeEnabled();

    // Action: Click Previous to go back to page 1
    await prevButton.click();

    // Wait for page change
  

    // Assert: Back to page 1
    await expect(page.locator('text=Page 1')).toBeVisible();
  });

  test('View booking dialog opens and closes', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Click View button on first booking
    const viewButtons = page.getByRole('button', { name: 'View' });
    await viewButtons.first().click();

    // Assert: Dialog should appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Action: Close dialog
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();

    // Assert: Dialog should close
    await expect(dialog).not.toBeVisible();
  });
});
