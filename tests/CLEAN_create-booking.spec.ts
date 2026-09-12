import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Create Booking Tests - Scenarios 6-7
 * 
 * 6. Valid new booking can be created and appears in list
 * 7. Form rejects invalid input (multiple validation cases)
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

  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

test.describe('Create Booking', () => {
  test('Scenario 6: Valid new booking is created and appears in list', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Note the current total
    const totalBefore = page.locator('text=12').first();
    await expect(totalBefore).toBeVisible();

    // Action: Navigate to new booking page
    await page.getByRole('link', { name: 'New booking' }).click();

    // Assert: Should be on new booking page
    await expect(page.getByRole('heading', { name: 'New booking' })).toBeVisible();

    // Action: Fill in the form with valid data
    const passengerName = 'John Smith';
    const email = 'john.smith@example.com';
    const flightNumber = 'W6789';
    const seats = '2';
    const departureDate = getTomorrowDate();

    await page.getByLabel('Passenger name').fill(passengerName);
    await page.getByLabel('Contact email').fill(email);
    await page.getByLabel('Flight number').fill(flightNumber);
    await page.getByLabel('Seats').fill(seats);
    await page.getByLabel('Departure date').fill(departureDate);

    // Action: Submit the form
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should be redirected to bookings list
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    // Assert: New booking should appear in the table
    const bookingRows = page.locator('table tbody tr');
    const firstRow = bookingRows.first();
    await expect(firstRow).toContainText(passengerName);
    await expect(firstRow).toContainText(flightNumber.toUpperCase());
  });

  test('Scenario 7a: Form rejects passenger name that is too short', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Fill with 1-character name (too short)
    await page.getByLabel('Passenger name').fill('A');
    await page.getByLabel('Contact email').fill('test@example.com');
    await page.getByLabel('Flight number').fill('W6123');
    await page.getByLabel('Seats').fill('1');
    await page.getByLabel('Departure date').fill(getTomorrowDate());

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should see validation error
    const errorMessage = page.locator('text=must be at least');
    await expect(errorMessage).toBeVisible();

    // Assert: Should still be on new booking page
    expect(page.url()).toContain('/bookings/new');
  });

  test('Scenario 7b: Form rejects invalid email format', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Fill with invalid email
    await page.getByLabel('Passenger name').fill('John Doe');
    await page.getByLabel('Contact email').fill('not-an-email');
    await page.getByLabel('Flight number').fill('W6123');
    await page.getByLabel('Seats').fill('1');
    await page.getByLabel('Departure date').fill(getTomorrowDate());

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should see validation error
    const errorMessage = page.locator('text=valid email');
    await expect(errorMessage).toBeVisible();

    // Assert: Should still be on new booking page
    expect(page.url()).toContain('/bookings/new');
  });

  test('Scenario 7c: Form rejects invalid flight number', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Fill with invalid flight number (not W6xxx format)
    await page.getByLabel('Passenger name').fill('Jane Doe');
    await page.getByLabel('Contact email').fill('jane@example.com');
    await page.getByLabel('Flight number').fill('BA123');
    await page.getByLabel('Seats').fill('1');
    await page.getByLabel('Departure date').fill(getTomorrowDate());

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should see validation error
    const errorMessage = page.locator('text=Flight number must look like W6123 or W61234');
    await expect(errorMessage).toBeVisible();

    // Assert: Should still be on new booking page
    expect(page.url()).toContain('/bookings/new');
  });

  test('Scenario 7d: Form rejects seats outside range (1-9)', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Test with seats = 0 (too few)
    await page.getByLabel('Passenger name').fill('Bob Smith');
    await page.getByLabel('Contact email').fill('bob@example.com');
    await page.getByLabel('Flight number').fill('W6123');
    await page.getByLabel('Seats').fill('0');
    await page.getByLabel('Departure date').fill(getTomorrowDate());

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should see validation error
    const errorMessage = page.locator('text=between');
    await expect(errorMessage).toBeVisible();

    // Assert: Should still be on new booking page
    expect(page.url()).toContain('/bookings/new');
  });

  test('Scenario 7e: Form rejects departure date in the past', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Set a date in the past
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().split('T')[0];

    await page.getByLabel('Passenger name').fill('Alice Wonder');
    await page.getByLabel('Contact email').fill('alice@example.com');
    await page.getByLabel('Flight number').fill('W6456');
    await page.getByLabel('Seats').fill('1');
    await page.getByLabel('Departure date').fill(yesterdayIso);

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should see validation error
    const errorMessage = page.locator('text=past');
    await expect(errorMessage).toBeVisible();

    // Assert: Should still be on new booking page
    expect(page.url()).toContain('/bookings/new');
  });

  test('Flight number is converted to uppercase', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Fill with lowercase flight number
    await page.getByLabel('Passenger name').fill('Test User');
    await page.getByLabel('Contact email').fill('test@example.com');
    await page.getByLabel('Flight number').fill('w6999');
    await page.getByLabel('Seats').fill('1');
    await page.getByLabel('Departure date').fill(getTomorrowDate());

    // Action: Submit
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should be on bookings list
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    // Assert: Flight number should be uppercase
    await expect(page.locator('table tbody tr').first()).toContainText('W6999');
  });

  test('Cancel button returns without saving', async ({ page, request }) => {
    // Setup: Create test user and sign in
    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    // Note the total before
    const totalBefore = page.locator('text=12').first();
    await expect(totalBefore).toBeVisible();

    // Action: Navigate to new booking
    await page.getByRole('link', { name: 'New booking' }).click();

    // Start filling form
    await page.getByLabel('Passenger name').fill('Should Not Save');

    // Action: Click Cancel
    await page.getByRole('link', { name: 'Cancel' }).click();

    // Assert: Should be back on bookings page
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    // Assert: Should still show same total (no new booking added)
    await expect(totalBefore).toBeVisible();
  });

  test('Total bookings card should be updated after cancelling the a existing booking', async({page, request}) => {

    const user = await createTestUser(request);
    await signIn(page, user.email, user.password);

    //navigate to new booking
    const totalBefore = page.locator('text=12').first();
    await expect(totalBefore).toBeVisible();

    // Action: Navigate to new booking page
    await page.getByRole('link', { name: 'New booking' }).click();

    // Assert: Should be on new booking page
    await expect(page.getByRole('heading', { name: 'New booking' })).toBeVisible();

    // Action: Fill in the form with valid data
    const passengerName = 'John Smith';
    const email = 'john.smith@example.com';
    const flightNumber = 'W6789';
    const seats = '2';
    const departureDate = getTomorrowDate();

    await page.getByLabel('Passenger name').fill(passengerName);
    await page.getByLabel('Contact email').fill(email);
    await page.getByLabel('Flight number').fill(flightNumber);
    await page.getByLabel('Seats').fill(seats);
    await page.getByLabel('Departure date').fill(departureDate);

    // Action: Submit the form
    await page.getByRole('button', { name: 'Create booking' }).click();

    // Assert: Should be redirected to bookings list
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();

    //check for the total sets number prior to cncellation
    
    await expect(page.getByTestId('summary-seats')).toHaveText('31');
    await page.getByRole('button', {name: 'Cancel booking BK-0013'}).click();

    //to check the seats booked number changes after cancellation
    await expect(page.getByTestId('summary-seats')).toHaveText('30');
  })
});
