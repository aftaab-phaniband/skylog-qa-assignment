# The Assignment

Three parts. Part 1 is the biggest, but Parts 2 and 3 matter — do not skip them
to squeeze in two more tests.

Read `APP_NOTES.md` first. It describes how the application is *supposed* to
behave, and it is the spec you are testing against.

---

## Part 1 — Automated tests (about 3–4 hours)

Write Playwright tests in `tests/`. Cover all eight of these:

| # | Scenario |
|---|---|
| 1 | A user with valid credentials can sign in and reaches the bookings list. |
| 2 | Signing in with a wrong password shows an error and does not navigate away. |
| 3 | After five failed attempts the account is locked, and the message says so. |
| 4 | The bookings list loads and shows the correct summary figures and rows. |
| 5 | Filtering by status shows only bookings with that status. |
| 6 | A valid new booking can be created and then appears in the list. |
| 7 | The new-booking form rejects invalid input. Cover at least three distinct cases. |
| 8 | When `GET /api/bookings` fails, the user sees an error state rather than an empty page. |

If you have time left, any of these are welcome. They are not required:

- Searching by passenger name.
- Pagination.
- Cancelling a booking.
- Visiting `/bookings` while signed out.
- Closing a dialog with the Escape key.
- Anything else you think is worth covering.

### Rules

These exist because they are the things we actually care about.

- **TypeScript.**
- **No `page.waitForTimeout()` and no arbitrary sleeps.** Not one. If you find
  yourself wanting one, that is the interesting part — tell us about it in
  `SUBMISSION.md`.
- **No XPath.**
- **Your tests must pass repeatedly with four workers.** We will run
  `npx playwright test --workers=4 --repeat-each=3`. A suite that passes once
  and fails on the third run is not finished.
- **Do not modify anything in `src/` or `server/`.** If you wanted a
  `data-testid` added somewhere, do not add it — list it in `SUBMISSION.md`
  with a one-line reason, the way you would raise it with a developer.
- You may change `playwright.config.ts` freely. Say what you changed and why.

### What we are looking for

Locator choices, how you handle waiting, whether tests are independent of each
other, how you set up state, and whether the suite reads clearly to someone who
did not write it. We would rather see six well-built tests than twelve rushed
ones.

---

## Part 2 — Exploratory testing (about 45 minutes)

Spend some time using the application as a person rather than as a script, with
`APP_NOTES.md` open next to you.

**There are somewhere between two and five deliberate bugs in this build.**
Find what you can and write them up in `SUBMISSION.md` — one report per bug,
with steps to reproduce, what you expected, what actually happened, and a
severity and priority with a sentence of reasoning.

Finding every one is not the point. A clear, reproducible report on two real
bugs beats a vague list of five.

If one of the required scenarios in Part 1 collides with a bug you have found,
that is not a mistake on your part. Handle it however you think is right and
explain your choice in `SUBMISSION.md`.

---

## Part 3 — Write-up (about 30 minutes)

Fill in `SUBMISSION.md`. It asks you for:

- How to run your tests.
- What you chose to automate and what you deliberately left manual.
- Anything you would do differently with more time.
- Where you think this suite is most likely to become flaky, and why.

Short and specific is better than long and thorough here.

---

## How we will assess it

| Weight | What |
|---|---|
| 30% | Playwright craft — locators, waiting, assertions, structure |
| 20% | Test isolation and reliability under parallel execution |
| 20% | Bug reports — clarity, reproducibility, sensible severity and priority |
| 15% | Coverage and test design — did you pick the cases that matter |
| 15% | Communication — the write-up, code readability, naming |

We are not scoring you on how many tests you wrote.
