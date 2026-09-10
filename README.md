# SkyLog — QA Automation Assignment

Thanks for taking the time to do this. It is a small React application with a
small API behind it. Your job is to test it: some of that with Playwright, some
of it by hand.

**Time expected: 4–6 hours. Please do not spend more than one day on it.**

If you get stuck on setup, email us rather than burning your evening on it — a
broken environment tells us nothing about you.

---

## What is in this folder

| Path | What it is |
|---|---|
| `ASSIGNMENT.md` | **Start here.** What we would like you to do, and the rules. |
| `APP_NOTES.md` | How the application is supposed to behave. This is your spec. |
| `SUBMISSION.md` | A template for your write-up. Fill this in and send it back. |
| `src/` | The React application. |
| `server/` | The Express API. In-memory, resets on restart. |
| `tests/` | Where your Playwright tests go. One worked example is already there. |
| `playwright.config.ts` | A starting configuration. Change it if you want to. |

---

## Setup

You will need **Node.js 20.19+ or 22.12+** (Vite 8 requires it). `node -v` to check.

```bash
npm install
npx playwright install chromium
```

Then start the app:

```bash
npm run dev
```

This starts two things at once:

- the API on **http://localhost:3001**
- the React app on **http://localhost:5173**

Open <http://localhost:5173> and sign in with:

```
Email:    qa@skylog.test
Password: Wizz@2024
```

Have a look around for ten minutes before you write any tests. It will make the
rest of this much faster.

---

## Running the tests

`playwright.config.ts` starts the app for you, so you do not need `npm run dev`
running in another terminal.

```bash
npm test              # headless
npm run test:headed   # watch it run in a browser
npm run test:ui       # Playwright's UI mode, useful while writing
npm run report        # open the HTML report from the last run
npm run typecheck     # tsc --noEmit
```

One example test ships in `tests/example.spec.ts`. Run it first to confirm your
setup works.

### Running tests from your editor

Install the **Playwright Test for VS Code** extension (`ms-playwright.playwright`)
— VS Code and Cursor will offer it when you open this folder. It puts a green
play icon in the gutter next to each test, and adds a Testing panel.

If the play icons do not appear: make sure the folder you opened is
`skylog-qa-assignment` itself (`playwright.config.ts` must be at the top level),
then refresh the Testing panel, or run `Developer: Reload Window`. Reloading is
also needed after a fresh `npm install`.

---

## Useful things to know

**The API is deliberately slow.** Every endpoint waits about 550ms before
responding, so the app has real loading states. This is intentional.

**Test data is per-user.** `POST /api/test/user` creates a fresh account with
its own copy of the 12 seeded bookings and returns its credentials. Tests that
use it do not interfere with each other. `example.spec.ts` shows how.

**The API has no database.** Everything lives in memory and resets when you
restart `npm run dev`. If the data looks strange, restart it.

**The demo account is shared.** `qa@skylog.test` is fine for reading, but if
several tests modify it at once they will fight. Bear that in mind.

Full API details are in `APP_NOTES.md`.

---

## Submitting

Send us back:

1. This folder with your tests in `tests/` — as a zip, or a link to a Git repo.
2. `SUBMISSION.md`, filled in.

Please do not include `node_modules/`.
