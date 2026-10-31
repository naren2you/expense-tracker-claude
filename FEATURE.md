# Feature brief: CSV export

This brief is written with the five prompt ingredients (Context, Task, Constraints,
Definition of done, Out of scope). Paste it into Claude Code as-is, or use it as the
model for every brief you write from now on.

## Context

This is a small Express 4 expense tracker. `src/app.js` holds all routes, `src/store.js`
reads and writes `data/expenses.json` (rows look like
`{ id, date: "2026-09-05", category: "food", amount: 320, note: "Swiggy dinner" }`).
Tests live in `test/` and run with `npm test` (`node --test`, no Jest). Existing tests
show how to start the app on a random port and make raw `http` requests. Keep that style.

## Task

Add `GET /expenses/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD` that returns every expense in
the date range as a CSV file, ordered by date ascending.

## Constraints

- The range is inclusive on both ends: `from=2026-09-01&to=2026-09-30` includes both days.
- First line is exactly the header `date,category,amount,note`. One row per expense after it, `\n` line endings.
- A note containing a comma, a double quote or a newline is wrapped in double quotes; a
  double quote inside it is doubled (`"`→`""`). Other fields are written as-is.
- `from` and `to` are both required and must be valid `YYYY-MM-DD` dates. Missing or
  invalid → `400` with JSON `{ "error": "<reason>" }`. `from` later than `to` → `400` too.
- Response headers: `Content-Type: text/csv; charset=utf-8` and
  `Content-Disposition: attachment; filename="expenses-<from>-<to>.csv"`
  (for example `expenses-2026-09-01-2026-09-30.csv`).
- An empty range is not an error: return `200` with only the header line.
- Put the route in `src/app.js` above the `// --- routes end ---` marker, or in a new
  `src/export.js` that `app.js` requires. No new npm dependencies.

## Definition of done

- `test/export.test.js` exists with at least 4 tests: happy path (header + row count for
  September), a quoted note with a comma, a 400 case, and the `Content-Disposition` header.
- `npm test` is fully green (fix the health test first if you have not already).
- Work is committed on a branch named `feature/csv-export` with at least one commit.
- `curl "localhost:3000/expenses/export.csv?from=2026-09-01&to=2026-09-30"` shows the header and 18 rows.

## Out of scope

- Filtering by category, pagination, Excel/XLSX, streaming for large files, a download
  button in `public/index.html`, and any change to existing routes or the data file.
