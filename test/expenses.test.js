const { test, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Work on a temp copy of the data so tests never touch data/expenses.json
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'expenses-')), 'expenses.json');
fs.copyFileSync(path.join(__dirname, '..', 'data', 'expenses.json'), tmp);
process.env.EXPENSES_FILE = tmp;

const app = require('../src/app');
const server = app.listen(0);
after(() => server.close());

function request(method, urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = data === undefined ? null : JSON.stringify(data);
    const req = http.request(
      {
        port: server.address().port,
        path: urlPath,
        method,
        headers: payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {},
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const json = res.headers['content-type']?.includes('json') ? JSON.parse(body) : body;
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('GET /expenses lists all rows', async () => {
  const res = await request('GET', '/expenses');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.strictEqual(res.body.length, 60);
  assert.deepStrictEqual(Object.keys(res.body[0]).sort(), ['amount', 'category', 'date', 'id', 'note']);
});

test('GET /expenses filters by inclusive date range', async () => {
  const res = await request('GET', '/expenses?from=2026-09-01&to=2026-09-30');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.length, 18);
  for (const row of res.body) {
    assert.ok(row.date >= '2026-09-01' && row.date <= '2026-09-30', row.date);
  }
});

test('GET /expenses filters by category', async () => {
  const res = await request('GET', '/expenses?category=rent');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.length, 3);
  assert.ok(res.body.every((r) => r.category === 'rent'));
});

test('POST /expenses adds a row and returns it with an id', async () => {
  const res = await request('POST', '/expenses', { date: '2026-10-21', amount: 150, category: 'food', note: 'Filter coffee' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.id, 'e61');
  assert.strictEqual(res.body.note, 'Filter coffee');

  const list = await request('GET', '/expenses?from=2026-10-21&to=2026-10-21');
  assert.strictEqual(list.body.length, 1);
});

test('POST /expenses rejects bad input with 400', async () => {
  const cases = [
    { date: '21-10-2026', amount: 100, category: 'food' },
    { date: '2026-10-21', amount: 0, category: 'food' },
    { date: '2026-10-21', amount: '100', category: 'food' },
    { date: '2026-10-21', amount: 100, category: '' },
    { date: '2026-10-21', amount: 100 },
  ];
  for (const body of cases) {
    const res = await request('POST', '/expenses', body);
    assert.strictEqual(res.status, 400, JSON.stringify(body));
    assert.ok(typeof res.body.error === 'string' && res.body.error.length > 0);
  }
});

test('GET /expenses/summary totals a month by category', async () => {
  const res = await request('GET', '/expenses/summary?month=2026-09');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.month, '2026-09');
  assert.strictEqual(res.body.total, 29257);
  assert.strictEqual(res.body.byCategory.food, 2600);
  assert.strictEqual(res.body.byCategory.rent, 18000);
  const sum = Object.values(res.body.byCategory).reduce((a, b) => a + b, 0);
  assert.strictEqual(sum, res.body.total);
});

test('GET /expenses/summary rejects a missing or malformed month', async () => {
  for (const q of ['', '?month=2026', '?month=2026-13', '?month=Sept']) {
    const res = await request('GET', '/expenses/summary' + q);
    assert.strictEqual(res.status, 400, q);
  }
});
