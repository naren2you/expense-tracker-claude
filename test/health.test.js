const { test, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

const server = app.listen(0);
after(() => server.close());

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ port: server.address().port, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}

test('GET /health reports status and version', async () => {
  const res = await get('/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'ok', version: '1.0.0' });
});
