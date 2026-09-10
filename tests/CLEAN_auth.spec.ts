import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Authentication Tests - Scenarios 1-3
 * 
 * 1. Valid sign in reaches bookings list
 * 2. Wrong password shows error without navigation
 * 3. After five failed attempts, account is locked
 */

async function createTestUser(request: APIRequestContext) {
  const response = await request.post('/api/test/user');
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ email: string; password: string }>;
}


test.describe('Authentication', () => {
  test('Scenario 1: Valid sign in reaches bookings list', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Action: Navigate to login and sign in
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    
    // Wait for navigation and click together
    await Promise.all([
      page.waitForURL('/bookings'),
      page.getByRole('button', { name: 'Sign in' }).click()
    ]);

    // Assert: Should be on bookings page
    expect(page.url()).toContain('/bookings');
    
    // Assert: Should see bookings heading
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
  });

  test('Scenario 2: Wrong password shows error and stays on login', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Action: Try to sign in with wrong password
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should see error message
    await expect(page.locator('text=Email or password is incorrect')).toBeVisible();

    // Assert: Should still be on login page
    expect(page.url()).toContain('/login');

    // Assert: Email should still be filled
    await expect(page.getByLabel('Email')).toHaveValue(user.email);
  });

  test('Scenario 3: After five failed attempts, account is locked', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Action: Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(`WrongPassword${i}`);
      await page.getByRole('button', { name: 'Sign in' }).click();

      // Wait for error message to appear
      await expect(page.locator('text=Email or password is incorrect')).toBeVisible();
    }

    // Action: Try to sign in again (6th attempt) with CORRECT password
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should see lockout message
    const errorMessage = page.locator('text=Too many failed attempts');
    await expect(errorMessage).toBeVisible();

    // Assert: Should not navigate to bookings
    expect(page.url()).toContain('/login');
  });

  test('Empty email and password shows validation error', async ({ page, request }) => {
    // Setup
    await createTestUser(request);

    // Action: Try to submit form with empty fields
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert: Should show validation error
    await expect(page.locator('text=Enter your email and password')).toBeVisible();

    // Assert: Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('Email is case-insensitive during login', async ({ page, request }) => {
    // Setup: Create test user
    const user = await createTestUser(request);

    // Action: Sign in with email in different case
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email.toUpperCase());
    await page.getByLabel('Password').fill(user.password);

    // Wait for navigation
    await Promise.all([
      page.waitForURL('/bookings'),
      page.getByRole('button', { name: 'Sign in' }).click()
    ]);

    // Assert: Should successfully sign in
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
  });
});
