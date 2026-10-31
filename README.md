# Expense tracker API (workshop starter)

A small Express 4 app with a JSON file store, used in Hour 2 of the Claude Code workshop.
Routes: `GET /health`, `GET /expenses?from&to&category`, `POST /expenses`, `GET /expenses/summary?month=YYYY-MM`.
A tiny vanilla-JS page at `public/index.html` lists, adds and filters by month.

```
npm install        # express only
npm test           # node --test; one health test fails on purpose (task 2.1: find it, fix it, re-run)
npm start          # http://localhost:3000
```

Feature briefs: `FEATURE.md` (Hour 2: `GET /expenses/export.csv?from&to`, task 2.2) and
`FEATURE-2.md` (stretch: summary over a date range). `.mcp.json.example` is for Hour 4 (task 4.2).

## Hour 2 setup

This folder becomes its own repo so your branch and commits are yours (and push to your own GitHub for task 2.3).
Same commands as `days/day1/README.md`, tasks 2.1 to 2.3:

```
cd starter
git init && git add -A && git commit -m "starter: tests green"    # task 2.1, after the health fix
git checkout -b feature/csv-export                                # task 2.2, before building
git remote add origin https://github.com/<you>/<repo>.git         # task 2.3, your own empty GitHub repo
git push -u origin feature/csv-export
```
