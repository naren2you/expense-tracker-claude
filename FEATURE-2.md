# Stretch feature: summary over a date range

Only start this once FEATURE.md is done and green. Same five ingredients, shorter.

## Context

`GET /expenses/summary?month=YYYY-MM` already returns `{ month, total, byCategory }`
from `src/app.js`. Tests for it are in `test/expenses.test.js`.

## Task

Extend the same route so it also accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive).
With `from`/`to` the response is `{ from, to, total, byCategory }`. With `month` it stays
exactly as it is today.

## Constraints

- Exactly one of the two forms must be given: `month`, or both `from` and `to`. Anything
  else (nothing, only `from`, `month` plus `from`) is `400` with `{ "error }`.
- Invalid dates and `from > to` are `400`.
- `byCategory` keys are sorted alphabetically so the output is stable for tests and diffs.
- Existing summary tests keep passing untouched.

## Definition of done

- At least 3 new tests in `test/summary-range.test.js` (range happy path, one 400 case, month form still works).
- `npm test` green, committed on the same `feature/csv-export` branch or a new `feature/summary-range` branch.

## Out of scope

Weekly or daily grouping, currency formatting, caching.
