# SkyLog — How the application should behave

This is the spec. When the application does something other than what is
written here, that is a bug worth reporting.

SkyLog is an internal console used by airline staff to look after passenger
bookings. There are three screens: sign in, the bookings list, and the
new-booking form.

---

## 1. Signing in (`/login`)

- Email and password are both required. Submitting with either one empty shows
  `Enter your email and password.` and does not call the API.
- Valid credentials take the user to `/bookings`.
- Invalid credentials show `Email or password is incorrect.` and the user stays
  on the sign-in page.
- The message is deliberately identical whether the email exists or not. The
  screen must never reveal whether an account exists.
- The email is trimmed and matched case-insensitively.
  `QA@SkyLog.test` and `qa@skylog.test` are the same account.
- **Lockout.** After **five** consecutive failed attempts the account locks for
  **30 seconds**. While locked, every attempt is refused with a message naming
  the wait, even if the password is now correct.
- A successful sign-in resets the failed-attempt counter.
- The lock expires on its own; the account works normally afterwards.
- The button reads `Signing in…` and is disabled while the request is in flight.
- The session is kept in `localStorage` and survives a page reload.

## 2. The bookings list (`/bookings`)

Requires a session. Signed-out visitors are sent to `/login`.

### Loading

- `Loading bookings…` is shown while the list is being fetched.
- If the fetch fails, the user sees an error message and a `Retry` button.
  `Retry` re-runs the request. An empty table is not an acceptable failure state.
- If the session has expired, the user is returned to `/login`.

### Summary cards

Three figures sit above the table:

| Card | Meaning |
|---|---|
| Total bookings | How many bookings the user has |
| Confirmed | How many currently have the status `Confirmed` |
| Seats booked | The sum of `seats` across all bookings |

These describe the bookings the user currently has. **When a booking changes,
the figures change with it** — they are not a snapshot from page load.

They always describe the whole data set, not the filtered view.

### The table

- Columns: Reference, Passenger, Flight, Seats, Departure, Status, Actions.
- **Five bookings per page.** A new account starts with 12, so three pages.
- `Previous` is disabled on the first page, `Next` on the last.
- The page indicator reads `Page 1 of 3`.
- Status is shown as a coloured badge: `Confirmed`, `Pending` or `Cancelled`.
- `View` opens a dialog with the booking's full details. It closes on `Close`
  or the `Escape` key.
- `Cancel` opens a confirmation dialog. It is disabled for bookings that are
  already cancelled.
- When nothing matches the filters, the table is replaced by
  `No bookings match your filters.`

### Search and filter

- **Search** matches any part of the passenger's name and **is not case
  sensitive**. Searching `priya`, `Priya` or `RAMAN` all find *Priya Raman*.
- Leading and trailing spaces in the search box are ignored.
- **Status** filters to one of `All`, `Confirmed`, `Pending` or `Cancelled`.
- Search and status apply together.
- Changing either one returns the user to page 1.

### Cancelling a booking

1. `Cancel` on a row opens a dialog naming the booking reference and passenger.
2. `Keep booking`, or `Escape`, closes it and changes nothing.
3. `Cancel booking` calls the API. The button reads `Cancelling…` while it works.
4. On success the dialog closes, the row's status becomes `Cancelled`, the
   summary figures update, and a confirmation appears reading
   `Booking BK-0001 cancelled.`
5. Notifications disappear on their own after about four seconds, and can be
   dismissed sooner with their close button.
6. If the API fails, an error notification appears and the booking is unchanged.

## 3. Creating a booking (`/bookings/new`)

| Field | Rule |
|---|---|
| Passenger name | Required. 2 to 60 characters. Trimmed before saving. |
| Contact email | Required. Must look like an email address. |
| Flight number | Required. `W6` followed by three or four digits, e.g. `W6123` or `W61234`. Lowercase input is accepted and saved uppercase. |
| Seats | Required. A whole number from **1 to 9**. |
| Departure date | Required. Today or later. Not in the past. |

- Validation runs when the form is submitted, not while typing.
- Each invalid field shows its own message beneath it, and the field is marked
  invalid for assistive technology.
- Validation happens in the browser first. The API validates independently and
  returns field-level errors, which are displayed the same way. **The two sets
  of rules are meant to agree** — the same input should be accepted or rejected
  by both.
- On success the user is returned to the list, a confirmation message appears,
  and the new booking is at the top of page 1 with the status `Confirmed`.
- `Cancel` returns to the list without saving.

---

## API reference

Everything is JSON. The app talks to `/api/...` and Vite forwards it to the
Express server on port 3001.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/login` | `{ email, password }` → `{ token, email }`. `401` invalid, `423` locked. |
| `POST` | `/api/logout` | Ends the session. |
| `GET` | `/api/bookings` | → `{ bookings: [...] }` for the signed-in user. |
| `POST` | `/api/bookings` | Creates one. `422` with `{ errors: { field: message } }` if invalid. |
| `PATCH` | `/api/bookings/:id/cancel` | `404` unknown, `409` already cancelled. |
| `POST` | `/api/test/user` | **Test support.** Creates a fresh account, returns `{ email, password }`. |
| `GET` | `/api/health` | Liveness check. |

Protected endpoints need `Authorization: Bearer <token>`.

A booking looks like this:

```json
{
  "id": "BK-0001",
  "passenger": "Priya Raman",
  "email": "priya.raman@example.com",
  "flightNumber": "W6501",
  "seats": 2,
  "departureDate": "2026-09-14",
  "status": "Confirmed"
}
```

### Seeded data

Every new account starts with the same 12 bookings: **7 Confirmed, 3 Pending,
2 Cancelled**, totalling **30 seats**. The first passenger is *Priya Raman*.

Because the data is identical for every account, you can rely on these numbers.

### Notes for testing

- Every endpoint waits about 550ms before responding. This is deliberate, to
  give the UI real loading states.
- There is no database. Restarting `npm run dev` resets everything.
- `POST /api/test/user` is the intended way to get isolated data. The demo
  account `qa@skylog.test` is shared by anyone using it at the time.
- The session token lives in `localStorage` under `skylog.token`.
