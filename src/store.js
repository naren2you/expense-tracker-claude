// JSON file store. One file, read on every request, written on every change.
// Set EXPENSES_FILE to point at a different file (tests use a temp copy).
const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.EXPENSES_FILE || path.join(__dirname, '..', 'data', 'expenses.json');

function readAll() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAll(rows) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2) + '\n');
}

function nextId(rows) {
  const max = rows.reduce((m, r) => {
    const n = parseInt(String(r.id).replace(/^e/, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `e${max + 1}`;
}

function add(expense) {
  const rows = readAll();
  const row = { id: nextId(rows), ...expense };
  rows.push(row);
  writeAll(rows);
  return row;
}

module.exports = { DATA_FILE, readAll, writeAll, add };
