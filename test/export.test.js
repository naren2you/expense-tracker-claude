const { test, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Work on a temp copy of the data so tests never touch data/expenses.json
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'export-')), 'expenses.json');
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
        res.setEncoding('utf8');
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

const HEADER = 'date,category,amount,note';
const SEPT = '/expenses/export.csv?from=2026-09-01&to=2026-09-30';

test('export returns header and 18 September rows in date order', async () => {
  const res = await request('GET', SEPT);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers['content-type'].startsWith('text/csv'));
  assert.ok(!res.body.includes('\r'));
  const lines = res.body.trimEnd().split('\n');
  assert.strictEqual(lines[0], HEADER);
  assert.strictEqual(lines.length - 1, 18);
  const dates = lines.slice(1).map((l) => l.split(',')[0]);
  assert.deepStrictEqual(dates, [...dates].sort());
});

test('export quotes a note containing a comma', async () => {
  const res = await request('GET', SEPT);
  assert.ok(res.body.includes(',"Groceries: rice, dal, oil"\n'));
});

test('export doubles quotes and quotes notes with newlines', async () => {
  await request('POST', '/expenses', { date: '2026-11-05', amount: 99, category: 'misc', note: 'He said "hi"\nbye' });
  const res = await request('GET', '/expenses/export.csv?from=2026-11-05&to=2026-11-05');
  assert.strictEqual(res.body, `${HEADER}\n2026-11-05,misc,99,"He said ""hi""\nbye"\n`);
});

test('export rejects missing, invalid or reversed dates with 400', async () => {
  const qs = [
    '',
    '?from=2026-09-01',
    '?to=2026-09-30',
    '?from=2026-9-1&to=2026-09-30',
    '?from=2026-09-01&to=2026-13-45',
    '?from=2026-09-30&to=2026-09-01',
  ];
  for (const q of qs) {
    const res = await request('GET', '/expenses/export.csv' + q);
    assert.strictEqual(res.status, 400, q);
    assert.ok(typeof res.body.error === 'string' && res.body.error.length > 0, q);
  }
});

test('export sets Content-Disposition filename from the range', async () => {
  const res = await request('GET', SEPT);
  assert.strictEqual(res.headers['content-disposition'], 'attachment; filename="expenses-2026-09-01-2026-09-30.csv"');
});

test('export range is inclusive on both ends', async () => {
  const all = (await request('GET', '/expenses?from=2026-09-01&to=2026-09-30')).body;
  const first = all[0].date;
  const last = all[all.length - 1].date;
  const res = await request('GET', `/expenses/export.csv?from=${first}&to=${last}`);
  assert.strictEqual(res.body.trimEnd().split('\n').length - 1, all.length);
  const single = await request('GET', `/expenses/export.csv?from=${first}&to=${first}`);
  const expected = all.filter((r) => r.date === first).length;
  assert.strictEqual(single.body.trimEnd().split('\n').length - 1, expected);
});

test('export of an empty range is 200 with only the header', async () => {
  const res = await request('GET', '/expenses/export.csv?from=2030-01-01&to=2030-01-31');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body, HEADER + '\n');
});
