/**
 * SkyLog API server.
 *
 * Deliberately simple: everything is in memory and resets when the process
 * restarts. There is no database and no real security here - this exists only
 * to give the React app something realistic to talk to.
 */
import express from 'express';
import cors from 'cors';
import { seedBookings, sampleNames } from './data.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.API_PORT || 3001;

/** Artificial latency so the UI has real loading states. */
const LATENCY_MS = Number(process.env.API_LATENCY_MS ?? 550);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Failed logins allowed before the account locks. */
const MAX_FAILED_ATTEMPTS = 5;
/** How long an account stays locked. */
const LOCK_DURATION_MS = 30_000;

/**
 * users: email -> { email, password, failedAttempts, lockedUntil, bookings }
 * Each user owns their own bookings, so tests that create their own user are
 * isolated from each other.
 */
const users = new Map();
/** token -> email */
const sessions = new Map();

let userCounter = 0;
let bookingCounter = 0;

function createUser(email, password) {
  const user = {
    email,
    password,
    failedAttempts: 0,
    lockedUntil: null,
    bookings: seedBookings(() => `BK-${String(++bookingCounter).padStart(4, '0')}`),
  };
  users.set(email.toLowerCase(), user);
  return user;
}

/** The shared demo account. Fine for read-only tests. */
createUser('qa@skylog.test', 'Wizz@2024');

function tokenFor(email) {
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  sessions.set(token, email.toLowerCase());
  return token;
}

/** Express middleware: resolves the bearer token to a user. */
function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const email = token ? sessions.get(token) : null;
  const user = email ? users.get(email) : null;
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' });
  }
  req.user = user;
  next();
}

// ---------------------------------------------------------------- auth

app.post('/api/login', async (req, res) => {
  await delay(LATENCY_MS);
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Email and password are required.' });
  }

  const user = users.get(String(email).trim().toLowerCase());

  // Locked accounts are rejected before the password is even checked.
  if (user?.lockedUntil && user.lockedUntil > Date.now()) {
    const secondsLeft = Math.ceil((user.lockedUntil - Date.now()) / 1000);
    return res.status(423).json({
      error: 'ACCOUNT_LOCKED',
      message: `Too many failed attempts. Try again in ${secondsLeft} seconds.`,
      secondsLeft,
    });
  }

  // A lock that has expired is cleared on the next attempt.
  if (user?.lockedUntil && user.lockedUntil <= Date.now()) {
    user.lockedUntil = null;
    user.failedAttempts = 0;
  }

  const passwordMatches = user && user.password === password;

  if (!passwordMatches) {
    if (user) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = Date.now() + LOCK_DURATION_MS;
        return res.status(423).json({
          error: 'ACCOUNT_LOCKED',
          message: `Too many failed attempts. Try again in ${LOCK_DURATION_MS / 1000} seconds.`,
          secondsLeft: LOCK_DURATION_MS / 1000,
        });
      }
    }
    // Deliberately identical for unknown emails and wrong passwords: the
    // response must not reveal whether an account exists.
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
  }

  user.failedAttempts = 0;
  user.lockedUntil = null;
  return res.json({ token: tokenFor(user.email), email: user.email });
});

app.post('/api/logout', authenticate, (req, res) => {
  const header = req.get('authorization') || '';
  sessions.delete(header.slice(7));
  res.json({ ok: true });
});

// ---------------------------------------------------------------- bookings

app.get('/api/bookings', authenticate, async (req, res) => {
  await delay(LATENCY_MS);
  res.json({ bookings: req.user.bookings });
});

app.post('/api/bookings', authenticate, async (req, res) => {
  await delay(LATENCY_MS);
  const { passenger, email, flightNumber, seats, departureDate } = req.body ?? {};

  const errors = {};
  if (!passenger || String(passenger).trim().length < 2) {
    errors.passenger = 'Passenger name must be at least 2 characters.';
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email ?? ''))) {
    errors.email = 'Enter a valid email address.';
  }
  if (!/^W6\d{3,4}$/.test(String(flightNumber ?? '').trim().toUpperCase())) {
    errors.flightNumber = 'Flight number must look like W6123 or W61234.';
  }
  const seatCount = Number(seats);
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 10) {
    errors.seats = 'Seats must be a whole number between 1 and 9.';
  }
  if (!departureDate) {
    errors.departureDate = 'Departure date is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ error: 'VALIDATION_FAILED', errors });
  }

  const booking = {
    id: `BK-${String(++bookingCounter).padStart(4, '0')}`,
    passenger: String(passenger).trim(),
    email: String(email).trim(),
    flightNumber: String(flightNumber).trim().toUpperCase(),
    seats: seatCount,
    departureDate,
    status: 'Confirmed',
  };
  req.user.bookings.unshift(booking);
  res.status(201).json({ booking });
});

app.patch('/api/bookings/:id/cancel', authenticate, async (req, res) => {
  await delay(LATENCY_MS);
  const booking = req.user.bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Booking not found.' });
  }
  if (booking.status === 'Cancelled') {
    return res.status(409).json({ error: 'ALREADY_CANCELLED', message: 'Booking is already cancelled.' });
  }
  booking.status = 'Cancelled';
  res.json({ booking });
});

// ---------------------------------------------------------------- test support
// These endpoints exist so that automated tests can create their own isolated
// data instead of sharing one account. They are documented in APP_NOTES.md.

app.post('/api/test/user', (req, res) => {
  const n = ++userCounter;
  const email = `worker${n}.${Date.now().toString(36)}@skylog.test`;
  const password = 'Wizz@2024';
  createUser(email, password);
  res.status(201).json({ email, password });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, users: users.size, sampleNames: sampleNames.length });
});

app.listen(PORT, () => {
  console.log(`[skylog-api] listening on http://localhost:${PORT}`);
  console.log(`[skylog-api] demo account: qa@skylog.test / Wizz@2024`);
});
